const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const apiKey = process.env.MAP_API_KEY;

module.exports.getCoordinate = async (address) => {
  const encodedAddress = encodeURIComponent(address);
  const url = `https://api.geoapify.com/v1/geocode/search?text=${encodedAddress}&apiKey=${apiKey}`;

  try {
    const response = await axios(url, {method: "GET"});
    const data = response.data;
    if (data.features.length > 0) {
      const location = data.features[0].geometry;
      return location;
    } else {
      console.log('No results found for address:', address);
      return null;
    }
  } catch (error) {
    console.log('Error fetching coordinates:', error.message);
    return null;
  }
};