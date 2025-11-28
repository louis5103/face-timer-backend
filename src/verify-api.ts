import axios from 'axios';

const API_URL = 'http://localhost:3000';
const EMAIL = `tester-${Date.now()}@example.com`;
const PASSWORD = 'Password123!';

async function verifyApi() {
  try {
    console.log(`🔍 API 검증 시작 (User: ${EMAIL})...
`);

    // 1. 회원가입
    console.log('1️⃣ 회원가입 시도...');
    const registerRes = await axios.post(`${API_URL}/auth/register`, {
      email: EMAIL,
      password: PASSWORD,
      name: 'Tester',
    });
    const { accessToken } = registerRes.data;
    console.log('✅ 회원가입 및 로그인 성공!');
    const headers = { Authorization: `Bearer ${accessToken}` };

    // 2. 태스크 생성
    console.log('2️⃣ 태스크 생성 (POST /tasks)...');
    const taskRes = await axios.post(
      `${API_URL}/tasks`,
      {
        title: 'Test Study',
        icon: 'code',
        color: '#3B82F6',
      },
      { headers },
    );
    const taskId = taskRes.data.id;
    console.log(`✅ 태스크 생성 완료: ${taskId}`);

    // 3. 타이머 시작 -> 2초 대기 -> 정지 (데이터 생성)
    console.log('3️⃣ 타이머 시작 (POST /timer/start)...');
    const startRes = await axios.post(
      `${API_URL}/timer/start`,
      { taskId },
      { headers },
    );
    const sessionId = startRes.data.id;

    console.log('   (2초 대기 중...)');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log('4️⃣ 타이머 정지 (POST /timer/stop)...');
    await axios.post(`${API_URL}/timer/${sessionId}/stop`, {}, { headers });
    console.log('✅ 타이머 세션 완료');

    // 4. 대시보드 조회
    console.log('5️⃣ 대시보드 통계 조회 (GET /statistics/dashboard)...');
    const dashboardRes = await axios.get(`${API_URL}/statistics/dashboard`, {
      headers,
    });
    console.log('✅ 대시보드 데이터:', dashboardRes.data);

    // 5. 일간 통계 조회
    console.log('6️⃣ 일간 통계 조회 (GET /statistics/daily)...');
    const today = new Date().toISOString().split('T')[0];
    const dailyRes = await axios.get(`${API_URL}/statistics/daily`, {
      headers,
      params: { date: today },
    });
    console.log('✅ 일간 통계 데이터:', JSON.stringify(dailyRes.data, null, 2));

    if (dashboardRes.data.todayTime >= 2) {
      console.log('\n🎉 검증 성공: 공부 시간이 정상적으로 집계되었습니다.');
    } else {
      console.error('\n❌ 검증 실패: 공부 시간이 집계되지 않았습니다.');
    }
  } catch (error: any) {
    console.error(
      '❌ 테스트 실패:',
      error.response ? error.response.data : error.message,
    );
  }
}

verifyApi();