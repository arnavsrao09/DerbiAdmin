// Development script to seed sample data
// Run with: node scripts/seedData.js

import mongoose from 'mongoose';
import FormResponse from '../models/FormResponse.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/derbiadmin';

const sampleSectors = ['HealthTech', 'Mobility', 'EdTech', 'FinTech', 'AgriTech', 'Other'];

const sampleFormData = [
  {
    'Company Name': 'HealthCare Solutions',
    'Email': 'contact@healthcare.com',
    'Phone': '+1234567890',
    'Description': 'Revolutionary healthcare platform'
  },
  {
    'Company Name': 'Mobility Plus',
    'Email': 'info@mobility.com',
    'Phone': '+1234567891',
    'Description': 'Smart transportation solutions'
  },
  {
    'Company Name': 'EduLearn',
    'Email': 'hello@edulearn.com',
    'Phone': '+1234567892',
    'Description': 'Online learning platform'
  }
];

async function seedData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await FormResponse.deleteMany({});
    // console.log('Cleared existing responses');

    // Create sample responses
    const responses = [];
    for (let i = 0; i < 30; i++) {
      const sector = sampleSectors[Math.floor(Math.random() * sampleSectors.length)];
      const formDataIndex = Math.floor(Math.random() * sampleFormData.length);
      const baseFormData = { ...sampleFormData[formDataIndex] };
      baseFormData['Company Name'] = `${baseFormData['Company Name']} ${i + 1}`;
      baseFormData['Email'] = `company${i + 1}@example.com`;

      const response = new FormResponse({
        sector,
        formData: baseFormData,
        uploadedFiles: [
          {
            fieldName: 'Pitch Deck',
            fileName: `pitch-deck-${i + 1}.pdf`,
            fileUrl: `https://example.com/files/pitch-deck-${i + 1}.pdf`
          },
          {
            fieldName: 'CIN Document',
            fileName: `cin-doc-${i + 1}.pdf`,
            fileUrl: `https://example.com/files/cin-doc-${i + 1}.pdf`
          }
        ],
        timestamp: new Date(Date.now() - i * 86400000) // Spread over last 30 days
      });

      responses.push(response);
    }

    await FormResponse.insertMany(responses);
    console.log(`Created ${responses.length} sample responses`);

    // Show distribution
    const distribution = await FormResponse.aggregate([
      {
        $group: {
          _id: '$sector',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\nSector Distribution:');
    distribution.forEach(item => {
      console.log(`  ${item._id}: ${item.count}`);
    });

    await mongoose.disconnect();
    console.log('\nSeeding complete!');
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();

