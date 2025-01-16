import { Space } from '../models/space.js';
import { getFileUrl } from '../config/multerconfig.js';
import path from 'path';

const createSpace = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }
    console.log(req.user);
    const { title, location, monthlyRent, roomType, description, amenities, flatmatePreferences } = req.body;
    const userId = req.user.userId;
    if (!location || !location.latitude || !location.longitude) {
      return res.status(400).json({ error: 'Location with latitude and longitude is required.' });
    }
    const images = req.files.map(file => getFileUrl(file.filename));
    const geoLocation = {
      type: 'Point',
      coordinates: [location.longitude, location.latitude] 
    };

    const space = new Space({
      userId,
      title,
      location: geoLocation, 
      monthlyRent,
      roomType,
      description,
      images,
      amenities,
      flatmatePreferences
    });

    await space.save();
    res.status(201).json({ status: 'success', data: space });
  } catch (error) {
    console.error('Create space error:', error);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

const getSpaces = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'monthlyRent', order = 'asc' } = req.query;

    const sortOrder = order === 'desc' ? -1 : 1;

    const spaces = await Space.find()
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ [sortBy]: sortOrder })
      .select('title location monthlyRent roomType description');

    const totalSpaces = await Space.countDocuments();

    res.status(200).json({
      status: 'success',
      data: spaces,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalSpaces / limit),
        totalItems: totalSpaces,
      },
    });
  } catch (error) {
    console.error('Get all spaces error:', error);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

const getSpaceById = async (req, res) => {
  try {
    const space = await Space.findById(req.params.id);
    if (!space) {
      return res.status(404).json({ status: 'error', message: 'Space not found' });
    }
    res.status(200).json({ status: 'success', data: space });
  } catch (error) {
    console.error('Get space by ID error:', error);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

const updateSpace = async (req, res) => {
  try {
    const { title, location, monthlyRent, roomType, description, amenities, flatmatePreferences } = req.body;
    const images = req.files ? req.files.map(file => file.path) : [];

    // Assuming location is being passed as { latitude, longitude }
    const geoLocation = location ? {
      type: 'Point',
      coordinates: [location.longitude, location.latitude]  // [longitude, latitude]
    } : undefined;

    const updatedSpace = await Space.findByIdAndUpdate(
      req.params.id,
      {
        title,
        location: geoLocation,
        monthlyRent,
        roomType,
        description,
        images,
        amenities,
        flatmatePreferences
      },
      { new: true }
    );

    if (!updatedSpace) {
      return res.status(404).json({ status: 'error', message: 'Space not found' });
    }
    res.status(200).json({ status: 'success', data: updatedSpace });
  } catch (error) {
    console.error('Update space error:', error);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

const deleteSpace = async (req, res) => {
  try {
    const space = await Space.findByIdAndDelete(req.params.id);
    if (!space) {
      return res.status(404).json({ status: 'error', message: 'Space not found' });
    }
    res.status(200).json({ status: 'success', message: 'Space deleted successfully' });
  } catch (error) {
    console.error('Delete space error:', error);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

export const spaceController = {
  createSpace,
  getSpaces,
  getSpaceById,
  updateSpace,
  deleteSpace
};
