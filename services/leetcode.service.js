import axios from 'axios';

const LeetCode_BaseUrl = 'https://leetcode-api-rk4o.onrender.com';

const leetCodeAPI = axios.create({
    baseURL: LeetCode_BaseUrl
});

export const leetCodeUserInfo = async (leetcodeID) => {
    try {
        // Define the endpoints to fetch data from
        const basicInfoEndpoint = `/${leetcodeID}`;
        // Define the endpoints to fetch Badege Data
        const badgesEndpoint = `/${leetcodeID}/badges`;
        // const fullProfileEndpoint = `/userProfile/${leetcodeID}`;
        const fullProfileEndpoint = `/${leetcodeID}/solved`;
        const contestEndpoint = `/${leetcodeID}/contest`;
        const calendarEndpoint = `/${leetcodeID}/calendar`;

        // Fetch data from both endpoints concurrently
        const [basicInfoRes, badgesRes, fullProfileRes, contestRes, calendarRes] = await Promise.all([
            leetCodeAPI.get(basicInfoEndpoint),
            leetCodeAPI.get(badgesEndpoint),
            leetCodeAPI.get(fullProfileEndpoint),
            leetCodeAPI.get(contestEndpoint),
            leetCodeAPI.get(calendarEndpoint)
        ]);

        // Combine the data into a single object
        const combinedData = {
            basicProfile: basicInfoRes.data || {},
            badges: badgesRes.data || {},
            completeProfile: fullProfileRes.data || {},
            contests: contestRes.data || {},
            calender: calendarRes.data || {}
        };

        return combinedData;
    } catch (error) {
        console.error('Error fetching LeetCode user info:', error);
        throw error;
    }
};
