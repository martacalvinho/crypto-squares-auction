import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MemeSubmissionForm from './MemeSubmissionForm';
import { Trophy, Flame, Clock, TrendingUp } from 'lucide-react';

const PEPE_IMAGE = "https://www.cryptopolitan.com/wp-content/uploads/2024/10/PEPE-WHALE-DUMPS-1-TRILLION-TOKENS-ON-BINANCE.jpg.webp";
const WOJAK_IMAGE = "https://r2d2content.moralis.com/wp-content/uploads/2023/04/Showing-the-Wojak-Crypto-Meme-1024x574.png";

interface MemeMatchup {
  id: string;
  leftMeme: {
    imageUrl: string;
    projectName: string;
    votes: number;
    spotNumber?: number;
  };
  rightMeme: {
    imageUrl: string;
    projectName: string;
    votes: number;
    spotNumber?: number;
  };
  endTime: Date;
  category: string;
}

export const MemeWars: React.FC = () => {
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentBattles] = useState<MemeMatchup[]>([
    {
      id: '1',
      leftMeme: {
        imageUrl: PEPE_IMAGE,
        projectName: 'PEPE',
        votes: 1234,
        spotNumber: 42
      },
      rightMeme: {
        imageUrl: WOJAK_IMAGE,
        projectName: 'Wojak',
        votes: 4321,
        spotNumber: 69
      },
      endTime: new Date(Date.now() + 86400000),
      category: 'classic-memes'
    },
    // Add more mock battles here
  ]);

  const handleVote = (battleId: string, side: 'left' | 'right') => {
    console.log(`Voted ${side} on battle ${battleId}`);
    // Implement voting logic
  };

  const handleSubmit = async (formData: FormData) => {
    console.log('Submitting meme:', formData);
    // Implement submission logic
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header and Stats Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">🎭 Meme Wars</h1>
          <div className="flex gap-2">
            {['all', 'project-vs-project', 'david-vs-goliath', 'this-week-in-crypto', 'classic-memes'].map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 text-sm rounded-lg ${
                  selectedCategory === category
                    ? 'bg-crypto-primary text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Compact Stats Bar */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center gap-1 text-sm text-gray-400">
              <Flame className="h-4 w-4 text-orange-500" />
              <span>Votes Today</span>
            </div>
            <div className="text-lg font-bold">24,689</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center gap-1 text-sm text-gray-400">
              <Clock className="h-4 w-4 text-blue-500" />
              <span>Active Battles</span>
            </div>
            <div className="text-lg font-bold">8</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center gap-1 text-sm text-gray-400">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span>Prize Pool</span>
            </div>
            <div className="text-lg font-bold">1.5 ETH</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center gap-1 text-sm text-gray-400">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span>Top Prize</span>
            </div>
            <div className="text-lg font-bold">0.5 ETH</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-5 gap-6">
        {/* Featured Battle - Left Side */}
        <div className="col-span-3 bg-gray-900 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">🔥 Featured Battle</h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Left Meme */}
            <div className="text-center">
              <div className="relative">
                {currentBattles[0].leftMeme.spotNumber && (
                  <div className="absolute top-2 left-2 bg-crypto-primary px-2 py-1 rounded-lg text-xs font-bold">
                    Spot #{currentBattles[0].leftMeme.spotNumber}
                  </div>
                )}
                <img 
                  src={currentBattles[0].leftMeme.imageUrl} 
                  alt={`${currentBattles[0].leftMeme.projectName} meme`}
                  className="rounded-lg w-full"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-2 w-full bg-crypto-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-crypto-light transition-colors text-sm"
                  onClick={() => handleVote(currentBattles[0].id, 'left')}
                >
                  Vote {currentBattles[0].leftMeme.projectName}
                </motion.button>
                <div className="mt-1 text-sm font-bold">
                  {currentBattles[0].leftMeme.votes.toLocaleString()} votes
                </div>
              </div>
            </div>

            {/* Right Meme */}
            <div className="text-center">
              <div className="relative">
                {currentBattles[0].rightMeme.spotNumber && (
                  <div className="absolute top-2 left-2 bg-crypto-primary px-2 py-1 rounded-lg text-xs font-bold">
                    Spot #{currentBattles[0].rightMeme.spotNumber}
                  </div>
                )}
                <img 
                  src={currentBattles[0].rightMeme.imageUrl} 
                  alt={`${currentBattles[0].rightMeme.projectName} meme`}
                  className="rounded-lg w-full"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-2 w-full bg-crypto-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-crypto-light transition-colors text-sm"
                  onClick={() => handleVote(currentBattles[0].id, 'right')}
                >
                  Vote {currentBattles[0].rightMeme.projectName}
                </motion.button>
                <div className="mt-1 text-sm font-bold">
                  {currentBattles[0].rightMeme.votes.toLocaleString()} votes
                </div>
              </div>
            </div>
          </div>

          {/* Battle Timer */}
          <div className="text-center mt-4 text-sm text-gray-400">
            Battle ends in: 23:59:59
          </div>
        </div>

        {/* Upcoming Battles - Right Side */}
        <div className="col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Upcoming Battles</h2>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-crypto-primary text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-crypto-light transition-colors"
              onClick={() => setShowSubmissionForm(true)}
            >
              Submit Meme
            </motion.button>
          </div>
          <div className="space-y-4">
            {[
              { project1: 'Solana', project2: 'Ethereum', time: '2h' },
              { project1: 'Bitcoin', project2: 'Dogecoin', time: '3h' },
              { project1: 'Cardano', project2: 'Polygon', time: '4h' }
            ].map((battle, i) => (
              <div key={i} className="bg-gray-900 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="font-medium">{battle.project1}</div>
                    <div className="text-xs text-gray-400">Spot #{Math.floor(Math.random() * 500) + 1}</div>
                  </div>
                  <div className="px-3 text-sm font-bold text-gray-400">VS</div>
                  <div className="flex-1 text-right">
                    <div className="font-medium">{battle.project2}</div>
                    <div className="text-xs text-gray-400">Spot #{Math.floor(Math.random() * 500) + 1}</div>
                  </div>
                </div>
                <div className="text-center mt-2 text-xs text-gray-400">
                  Starts in {battle.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hall of Fame */}
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4">🏆 Hall of Fame</h2>
        <div className="grid grid-cols-6 gap-4">
          {[
            { project: 'Bitcoin', votes: '12.5k', date: 'Jan 24' },
            { project: 'Ethereum', votes: '10.1k', date: 'Jan 23' },
            { project: 'Solana', votes: '9.8k', date: 'Jan 22' },
            { project: 'Avalanche', votes: '8.9k', date: 'Jan 21' },
            { project: 'Polygon', votes: '8.2k', date: 'Jan 20' },
            { project: 'Cardano', votes: '7.5k', date: 'Jan 19' }
          ].map((winner, i) => (
            <div key={i} className="bg-gray-900 rounded-lg p-3">
              <div className="font-medium">{winner.project}</div>
              <div className="text-xs text-gray-400">{winner.votes} votes</div>
              <div className="text-xs text-gray-500 mt-1">{winner.date}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Submission Form Modal */}
      {showSubmissionForm && (
        <MemeSubmissionForm
          onClose={() => setShowSubmissionForm(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

export default MemeWars;
