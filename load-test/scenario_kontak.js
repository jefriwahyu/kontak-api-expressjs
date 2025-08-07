import http from 'k6/http';
import { check, sleep, group } from 'k6';

// --- KONFIGURASI TES ---
export const options = {
  stages: [
    { duration: '10s', target: 10 }, // Mulai dengan 1 user untuk test
    { duration: '20s', target: 10 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    'http_req_failed': ['rate<0.05'],
    'http_req_duration': ['p(95)<800'],
  },
};

const BASE_URL = 'http://localhost:5000/api/kontak';

// --- SKENARIO PENGUJIAN ---
export default function () {
  // Pastikan data sesuai dengan validasi server (sama seperti manual test yang berhasil)
  const contactData = {
    nama: `K6 User ${__VU}-${__ITER}`, // String nama yang valid
    email: `k6user${__VU}${__ITER}@test.com`, // Format email yang valid  
    no_hp: `081${String(Math.floor(100000000 + Math.random() * 900000000)).padStart(9, '0')}` // Format 081xxxxxxxxx
  };
  
  console.log(`[${__VU}-${__ITER}] Contact data to send:`, JSON.stringify(contactData));
  
  const payload = JSON.stringify(contactData);
  const params = { 
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    } 
  };
  
  let contactId = null;

  // --- LANGKAH 1: CREATE ---
  console.log(`[${__VU}-${__ITER}] Attempting to CREATE contact...`);
  const createRes = http.post(`${BASE_URL}/`, payload, params);
  
  console.log(`[${__VU}-${__ITER}] CREATE Response: Status=${createRes.status}`);
  console.log(`[${__VU}-${__ITER}] CREATE Response Body:`, createRes.body);
  
  const createCheck = check(createRes, { 
    'CREATE: status is 201': (r) => r.status === 201,
    'CREATE: response has success=true': (r) => {
      try {
        const data = r.json();
        return data.success === true;
      } catch (e) {
        console.error(`[${__VU}-${__ITER}] Error parsing CREATE response: ${e}`);
        return false;
      }
    }
  });
  
  if (createCheck && createRes.status === 201) {
    try {
      const responseData = createRes.json();
      contactId = responseData.data?._id || responseData.data?.id;
      console.log(`[${__VU}-${__ITER}] CREATE Success: ContactID=${contactId}`);
    } catch (e) {
      console.error(`[${__VU}-${__ITER}] Error extracting contactId: ${e}`);
      return;
    }
  } else {
    console.error(`[${__VU}-${__ITER}] CREATE Failed - stopping iteration`);
    return; 
  }

  if (!contactId) {
    console.error(`[${__VU}-${__ITER}] No contactId received - stopping iteration`);
    return;
  }

  sleep(1);

  // --- LANGKAH 2: FAVORITE & UNFAVORITE (TOGGLE) ---
  group('2. FAVORITE Toggle', function () {
    // Test GET contact dulu untuk memastikan contact ada
    console.log(`[${__VU}-${__ITER}] Testing GET contact ${contactId}...`);
    const getRes = http.get(`${BASE_URL}/${contactId}`, { headers: { 'Accept': 'application/json' } });
    console.log(`[${__VU}-${__ITER}] GET Response: Status=${getRes.status}`);
    
    if (getRes.status !== 200) {
      console.error(`[${__VU}-${__ITER}] GET contact failed, skipping FAVORITE tests`);
      return;
    }
    
    // Menjadikan favorit
    console.log(`[${__VU}-${__ITER}] Attempting to ADD FAVORITE...`);
    const addFavoriteRes = http.patch(`${BASE_URL}/${contactId}/favorite`, null, { 
      headers: { 'Accept': 'application/json' } 
    });
    console.log(`[${__VU}-${__ITER}] ADD FAVORITE Response: Status=${addFavoriteRes.status}`);
    console.log(`[${__VU}-${__ITER}] ADD FAVORITE Response Body:`, addFavoriteRes.body);
    
    check(addFavoriteRes, {
      'FAVORITE (Add): status is 200': (r) => r.status === 200,
      'FAVORITE (Add): response has success=true': (r) => {
        try {
          const data = r.json();
          return data.success === true;
        } catch (e) {
          console.error(`[${__VU}-${__ITER}] Error parsing ADD FAVORITE response: ${e}`);
          return false;
        }
      }
    });

    sleep(0.5);

    // Membatalkan favorit (cleanup)
    console.log(`[${__VU}-${__ITER}] Attempting to REMOVE FAVORITE...`);
    const removeFavoriteRes = http.patch(`${BASE_URL}/${contactId}/favorite`, null, { 
      headers: { 'Accept': 'application/json' } 
    });
    console.log(`[${__VU}-${__ITER}] REMOVE FAVORITE Response: Status=${removeFavoriteRes.status}`);
    console.log(`[${__VU}-${__ITER}] REMOVE FAVORITE Response Body:`, removeFavoriteRes.body);
    
    check(removeFavoriteRes, {
      'FAVORITE (Remove): status is 200': (r) => r.status === 200,
      'FAVORITE (Remove): response has success=true': (r) => {
        try {
          const data = r.json();
          return data.success === true;
        } catch (e) {
          console.error(`[${__VU}-${__ITER}] Error parsing REMOVE FAVORITE response: ${e}`);
          return false;
        }
      }
    });
  });

  sleep(1);

  // --- LANGKAH 3: DELETE (Cleanup) ---
  group('3. DELETE the contact', function () {
    console.log(`[${__VU}-${__ITER}] Attempting to DELETE contact ${contactId}...`);
    const deleteRes = http.del(`${BASE_URL}/${contactId}`, null, { 
      headers: { 'Accept': 'application/json' } 
    });
    console.log(`[${__VU}-${__ITER}] DELETE Response: Status=${deleteRes.status}`);
    console.log(`[${__VU}-${__ITER}] DELETE Response Body:`, deleteRes.body);
    
    check(deleteRes, { 
      'DELETE: status is 200': (r) => r.status === 200,
      'DELETE: response has success=true': (r) => {
        try {
          const data = r.json();
          return data.success === true;
        } catch (e) {
          console.error(`[${__VU}-${__ITER}] Error parsing DELETE response: ${e}`);
          return false;
        }
      }
    });
  });
}