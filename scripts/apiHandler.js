'use strict';

// Fetches data from given url,
// transforms string to json, returns data,
// catches errors and logs them
async function fetchData(url) {
    try {
        const response = await fetch(url);
        const data = response.json();

        return data;
    } catch(error) {
        console.log(error);
        return null;
    }
}

export default { fetchData };