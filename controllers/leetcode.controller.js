import { User } from '../models/user.model.js';
import { LeetCode } from '../models/leetcode.model.js';
import mongoose from 'mongoose';
import { leetCodeUserInfo } from '../services/leetcode.service.js';

export const getLCodeUserInfo = async (req, res) => {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid user ID format', success: false });
    }

    try {
        const user = await User.findById(userId);
        if (!user || !user.leetCodeID) {
            return res.status(404).json({
                message: 'User Not Found or No LeetCode ID provided',
                success: false
            });
        }

        // Validate if the LeetCode account exists
        const freshData = await leetCodeUserInfo(user.leetCodeID);
        if (!freshData.basicProfile?.username) {
            return res.status(404).json({
                message: 'Invalid LeetCode account',
                success: false
            });
        }

        // Check if we have recent data in the database
        let leetcodeData = await LeetCode.findOne({ userId });
        const isDataStale = !leetcodeData || 
            Date.now() - leetcodeData.lastUpdated > 24 * 60 * 60 * 1000;

        if (isDataStale) {
            // Fetch fresh data from LeetCode API
            const freshData = await leetCodeUserInfo(user.leetCodeID);
            
            // Process calendar data if needed
            if (typeof freshData.calender === 'string') {
                try {
                    freshData.calender = JSON.parse(freshData.calender);
                } catch (e) {
                    freshData.calender = new Map();
                }
            }
            
            if (leetcodeData) {
                // Update existing record
                leetcodeData = await LeetCode.findOneAndUpdate(
                    { _id: leetcodeData._id },
                    {
                        ...freshData,
                        lastUpdated: Date.now()
                    },
                    { new: true }
                );
            } else {
                // Create new record
                leetcodeData = await LeetCode.create({
                    userId,
                    ...freshData,
                    lastUpdated: Date.now()
                });
            }
        }

        const formattedResponse = {
            basicProfile: leetcodeData.basicProfile || {},
            badges: {
                badges: leetcodeData.badges?.badges || [],
                badgesCount: leetcodeData.badges?.badgesCount || 0
            },
            completeProfile: leetcodeData.completeProfile || {},
            contests: leetcodeData.contests || {},
            calender: leetcodeData.calender || {}
        };

        return res.status(200).json(formattedResponse);
    } catch (error) {
        console.error('LeetCode Error:', error);
        return res.status(500).json({
            message: 'Error fetching LeetCode user information',
            success: false,
            error: error.message
        });
    }
};