
import express from 'express';
import { spawn } from 'child_process';
import MBTIAnalysis from '../models/data.js';
import path from 'path';

const validateScores = (scores) => {
    return Array.isArray(scores) && 
           scores.length === 20 &&
           scores.every(score => typeof score === 'number');
};
const analyzePersonality = async (req, res) => {
      if (!req.id) {
        return res.status(401).json({ error: 'User not authenticated.' });
      }
    const {scores} = req.body;
    const userId=req.id;
    console.log(req.body);
    if (!validateScores(scores)) {
        return res.status(400).json({
            error: 'Invalid input: Expected array of 20 numeric scores'
        });
    }
    try {
        const pythonResult = await runPythonAnalysis(scores);
        console.log("python result",pythonResult);
        const formattedResult = formatAnalysisResult(pythonResult);
        console.log(formattedResult);
        const mbtiAnalysis = new MBTIAnalysis({
            userId: userId, 
            type: formattedResult.type,
            overallPersonalityScore: formattedResult.overallScore,
            preferenceAlignment: formattedResult.preferenceAlignment,

            preferenceBreakdown: {
                EI: formattedResult.preferences.EI.preference,
                EIPercentage: formattedResult.preferences.EI.percentage,
                SN: formattedResult.preferences.SN.preference,
                SNPercentage: formattedResult.preferences.SN.percentage,
                TF: formattedResult.preferences.TF.preference,
                TFPercentage: formattedResult.preferences.TF.percentage,
                JP: formattedResult.preferences.JP.preference,
                JPPercentage: formattedResult.preferences.JP.percentage
            },
           
        });

        await mbtiAnalysis.save();
        res.json({
            analysisId: mbtiAnalysis._id,
            result: mbtiAnalysis
        });

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(error.status || 500).json({
            error: error.message || 'Internal server error',
            details: error.details
        });
    }
};

const runPythonAnalysis = (scores) => {
    return new Promise((resolve, reject) => {
        const [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15, s16, s17, s18, s19, s20
        ] = scores;
        const pythonProcess = spawn('python', ['mbti_predictor.py',s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15, s16, s17, s18, s19, s20]);
        
        let result = '';
        let error = '';
    
        pythonProcess.stdout.on('data', (data) => {
            result += data.toString();
            console.log(result);
        });

        pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
        });

        const timeout = setTimeout(() => {
            pythonProcess.kill();
            reject({
                status: 504,
                message: 'Process timed out'
            });
        }, 30000);

        pythonProcess.on('close', (code) => {
            clearTimeout(timeout);
            
            if (code !== 0) {
                reject({
                    status: 500,
                    message: 'Python script execution failed',
                    details: error || `Process exited with code ${code}`
                });
                return;
            }

            try {
                const trimmedResult = result.trim();
                console.log(trimmedResult);
                if (!trimmedResult) {
                    throw new Error('Empty result from Python script');
                }
                const parsedResult = JSON.parse(trimmedResult); // Expecting JSON output
                resolve(parsedResult);
            } catch (e) {
                reject({
                    status: 500,
                    message: 'Failed to parse results',
                    details: e.message || 'Invalid JSON returned from Python script'
                });
            }
        });

        pythonProcess.on('error', (err) => {
            clearTimeout(timeout);
            reject({
                status: 500,
                message: 'Failed to start Python process',
                details: err.message
            });
        });
    });
};

const formatAnalysisResult = (result) => {


    try {
        const data = result; 
        console.log(data)
        const getPreference = (score, options) => {
            return {
                preference: score > 50 ? options[0] : options[1],
                percentage: Math.abs(score - 50) * 2  // Convert score to percentage
            };
        };
        const dominantTraits = data.personality_scores.dominant_traits.map(([trait, value]) => ({
            trait,
            value
        }));
        

        return {
            type: data.type, 
            overallScore: data.personality_scores.overall_score,
            preferenceAlignment: data.personality_scores.preference_alignment, 
            traits: {
                dominantTraits: dominantTraits,
            },
            preferences: {
                EI: getPreference(data.scores['E/I'], ['Extraversion', 'Introversion']),
                SN: getPreference(data.scores['S/N'], ['Sensing', 'Intuition']),
                TF: getPreference(data.scores['T/F'], ['Thinking', 'Feeling']),
                JP: getPreference(data.scores['J/P'], ['Judging', 'Perceiving']),
            },
            development: {
                creativity: data.personality_scores.trait_development.Creativity,
                enthusiasm: data.personality_scores.trait_development.Enthusiasm,
                innovation: data.personality_scores.trait_development.Innovation,
                peopleOriented: data.personality_scores.trait_development['People-oriented'],
            },
        };
    } catch (error) {
        throw new Error('Failed to parse Python script output: ' + error.message);
    }
};


const getAnalysisById = async (req, res) => {
    try {
        const analysis = await MBTIAnalysis.findById(req.params.id);
        if (!analysis) {
            return res.status(404).json({ error: 'Analysis not found' });
        }
        res.json(analysis);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch analysis',
            details: error.message
        });
    }
};


export const personalityController = {
    analyzePersonality,getAnalysisById
  };
  