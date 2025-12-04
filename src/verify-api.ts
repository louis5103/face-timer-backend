import axios from 'axios';

const API_URL = 'http://localhost:3000';
const EMAIL = 'test@example.com';
const PASSWORD = 'Password123!';

async function verifyApi() {
  try {
    console.log(`🔍 API 검증 시작 (User: ${EMAIL})...\n`);

    // 1. 로그인
    console.log('1️⃣ 로그인 시도...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: EMAIL,
      password: PASSWORD,
    });
    const { accessToken } = loginRes.data;
    console.log('✅ 로그인 성공!');
    const headers = { Authorization: `Bearer ${accessToken}` };

    // 2. 태스크 목록 조회
    console.log('2️⃣ 태스크 목록 조회 (GET /tasks)...');
    const tasksRes = await axios.get(`${API_URL}/tasks`, { headers });
    console.log(`✅ 총 ${tasksRes.data.length}개의 태스크가 있습니다.`);
    tasksRes.data.forEach((t: any) => {
      console.log(`   - ${t.title}: ${Math.floor(t.totalTime / 60)}분`);
    });

    // 3. 대시보드 조회
    console.log('\n3️⃣ 대시보드 통계 조회 (GET /statistics/dashboard)...');
    const dashboardRes = await axios.get(`${API_URL}/statistics/dashboard`, {
      headers,
    });
    console.log('✅ 대시보드 데이터:', dashboardRes.data);

    // 4. 월간 통계 조회 (데이터가 가장 확실하게 보임)
    console.log('\n4️⃣ 월간 통계 조회 (GET /statistics/monthly)...');
    const now = new Date();
    const monthlyRes = await axios.get(`${API_URL}/statistics/monthly`, {
      headers,
      params: { year: now.getFullYear(), month: now.getMonth() + 1 },
    });
    console.log(`✅ 월간 총 공부 시간: ${Math.floor(monthlyRes.data.totalTime / 60)}분`);
    console.log(`✅ 일별 데이터 수: ${monthlyRes.data.dailyBreakdown.length}일`);

  } catch (error: any) {
    console.error(
      '❌ 테스트 실패:',
      error.response ? error.response.data : error.message,
    );
  }
}

verifyApi();
