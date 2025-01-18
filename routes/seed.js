import { createUsers, createMBTIAnalyses, createMatchResults, createSpaces } from '../controllers/seederService.js';

export const seedDatabase = async (req, res) => {
  try {
    // await Promise.all([
    //   User.deleteMany({}),
    //   Space.deleteMany({}),
    //   MBTIAnalysis.deleteMany({}),
    //   MatchResult.deleteMany({})
    // ]);
    // console.log('Cleared existing data');

    const users = await createUsers();
    await Promise.all([
      createMBTIAnalyses(users),
      createMatchResults(users),
      createSpaces(users)
    ]);

    console.log('Database seeding completed successfully');
    res.status(200).json({ message: 'Database seeding completed successfully' });
  } catch (error) {
    console.error('Error seeding database:', error);
    res.status(500).json({ message: 'Error seeding database', error });
  }
};