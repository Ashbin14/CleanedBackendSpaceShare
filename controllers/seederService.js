import User from '../models/user.js';
import { faker } from '@faker-js/faker';
import MBTIAnalysis from '../models/data.js';
import MatchResult from '../models/matcheduser.js';
import { Space } from '../models/space.js';

const MBTI_TYPES = ['INTJ', 'ENTP', 'ISFP', 'ESFJ', 'INFP', 'ESTP', 'ENFJ', 'ISTJ']; 
const COGNITIVE_FUNCTIONS = ['Ni', 'Se', 'Fi', 'Te', 'Si', 'Ne', 'Ti', 'Fe'];

const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

export async function createUsers(count = 50) {
  const users = [];
  for (let i = 0; i < count; i++) {
    const user = new User({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      age: randomNumber(18, 65),
      gender: faker.helpers.arrayElement(['male', 'female', 'other']),
      phoneNumber: faker.phone.number(),
      email: faker.internet.email(),
      password: 'Password123!',
      images: Array(randomNumber(1, 4)).fill(null).map(() => faker.image.avatar())
    });
    users.push(await user.save());
  }
  console.log(`Created ${users.length} users`);
  return users;
}

export async function createMBTIAnalyses(users) {
  const analyses = [];
  for (const user of users) {
    const analysis = new MBTIAnalysis({
      userId: user._id,
      type: faker.helpers.arrayElement(MBTI_TYPES),
      overallPersonalityScore: randomNumber(60, 100),
      preferenceAlignment: randomNumber(70, 100),
      dominantTraits: {},
      preferenceBreakdown: {},
      traitDevelopmentScores: {},
      cognitiveFunctions: faker.helpers.arrayElements(COGNITIVE_FUNCTIONS, { min: 4, max: 8 })
    });
    analyses.push(await analysis.save());
  }
  console.log(`Created ${analyses.length} MBTI analyses`);
  return analyses;
}

export async function createMatchResults(users) {
  const matchResults = [];
  for (const user of users) {
    const potentialMatches = users.filter(u => u._id !== user._id);
    const matches = faker.helpers.arrayElements(potentialMatches, { min: 3, max: 10 })
      .map(matchedUser => ({
        matchedUserId: matchedUser._id,
        similarityScore: randomNumber(50, 100),
        mbtiType: faker.helpers.arrayElement(MBTI_TYPES),
        timestamp: faker.date.past()
      }));

    const matchResult = new MatchResult({
      userId: user._id,
      matches,
      totalMatches: matches.length,
      calculatedAt: faker.date.recent()
    });
    matchResults.push(await matchResult.save());
  }
  console.log(`Created ${matchResults.length} match results`);
  return matchResults;
}

export async function createSpaces(users) {
  const spaces = [];
  for (let i = 0; i < users.length / 2; i++) {
    const space = new Space({
      userId: faker.helpers.arrayElement(users)._id,
      title: faker.lorem.words(3),
      location: { type: 'Point', coordinates: [faker.location.longitude(), faker.location.latitude()] },
      monthlyRent: randomNumber(500, 3000),
      roomType: faker.helpers.arrayElement(['private', 'shared', 'studio']),
      description: faker.lorem.paragraph(),
      images: Array(randomNumber(3, 6)).fill(null).map(() => faker.image.url()),
      amenities: {},
      flatmatePreferences: {}
    });
    spaces.push(await space.save());
  }
  console.log(`Created ${spaces.length} spaces`);
  return spaces;
}