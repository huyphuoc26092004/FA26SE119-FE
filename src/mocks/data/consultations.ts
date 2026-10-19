import type {
  ConsultationRequest,
  ConsultantDashboardStats,
  ConsultationAdvicePillars,
  ConsultationTopic,
} from '../../types/consultation';

export const mockConsultationRequests: ConsultationRequest[] = [
  {
    id: 'CR-2026-081',
    consultantId: '2',
    consultantName: 'Taylor Lee',
    topic: 'CV_REVIEW',
    topicLabel: 'Tối ưu hóa CV & ATS chuẩn Quốc tế',
    priority: 'URGENT',
    status: 'PENDING',
    requestedAt: '2026-10-18T08:30:00Z',
    targetGoal: 'Ứng tuyển vị trí Senior Frontend Engineer tại các công ty Fintech & Unicorn Đông Nam Á',
    candidateNotes:
      'CV hiện tại của em sau khi quét bằng hệ thống đạt điểm ATS là 84/100. Tuy nhiên khi nộp vào các công ty lớn như Grab, MoMo thì tỉ lệ phản hồi còn thấp. Em muốn nhờ Chuyên gia rà soát lại cách cấu trúc dự án và chuẩn hóa các chỉ số đo lường (Impact Metrics) theo công thức STAR/XYZ.',
    candidateQuestions: [
      'Làm thế nào để mô tả các bài toán tối ưu performance (Web Vitals) trong dự án React lớn một cách thuyết phục nhất?',
      'Cách sắp xếp kinh nghiệm 4 năm để làm nổi bật vai trò Tech Lead / Frontend Chapter Lead?',
      'Có nên bỏ bớt các công nghệ cũ như jQuery hay các dự án đại học để CV gọn trong 1 trang chuẩn quốc tế?',
    ],
    currentObstacles:
      'Chưa biết cách chuyển tải tác động kinh doanh (Business Impact) thay vì chỉ liệt kê các đầu việc kỹ thuật thông thường.',
    candidate: {
      id: '1',
      name: 'Alex Morgan (Alex Nguyễn)',
      email: 'candidate@example.com',
      phone: '+84 912 345 678',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      location: 'Hồ Chí Minh, Việt Nam',
      currentTitle: 'Mid-Senior Frontend Engineer',
      targetRole: 'Senior Frontend Engineer / Tech Lead',
      experienceLevel: 'Senior (4+ năm)',
      yearsOfExperience: 4.5,
      topSkills: ['React 19', 'Next.js 15', 'TypeScript', 'Tailwind CSS', 'Redux Toolkit', 'Performance Optimization'],
      attachedResumeId: 'res-alex-01',
      attachedResumeName: 'Alex_Nguyen_Senior_Frontend_2026.pdf',
      attachedResumeScore: 84,
      linkedIn: 'https://linkedin.com/in/alex-nguyen-dev',
      github: 'https://github.com/alexnguyen-frontend',
      bio: 'Frontend Engineer đam mê kiến trúc component quy mô lớn, Design System và tối ưu hiệu năng web tốc độ cao.',
    },
    meeting: {
      platform: 'Google Meet',
      meetingUrl: 'https://meet.google.com/abc-cr81-xyz',
      meetingCode: 'abc-cr81-xyz',
      scheduledAt: '2026-10-19T14:30:00Z',
      durationMinutes: 45,
    },
    evaluationRubric: {
      cvQuality: 8,
      technicalDepth: 9,
      communication: 8,
      marketReadiness: 8,
    },
    consultantPrivateNotes:
      'Hồ sơ của Alex có nền tảng kỹ thuật rất tốt, kiến trúc component chuẩn mực. Điểm nghẽn chính nằm ở summary chưa định vị rõ vai trò Senior Leader và các bullet point còn thiếu con số phần trăm tăng tốc hoặc giảm bounce rate.',
    messages: [
      {
        id: 'msg-081-1',
        senderId: '1',
        senderName: 'Alex Morgan',
        senderRole: 'CANDIDATE',
        content:
          'Chào Chuyên gia Taylor Lee! Em vừa gửi yêu cầu rà soát CV cùng file đính kèm. Em rất mong sớm nhận được phản hồi từ Chuyên gia ạ.',
        timestamp: '2026-10-18T08:35:00Z',
      },
    ],
    timeline: [
      {
        id: 'tl-081-1',
        status: 'PENDING',
        title: 'Yêu cầu tư vấn được khởi tạo',
        description: 'Ứng viên Alex Morgan đã nộp hồ sơ và đề xuất lịch tư vấn trực tuyến 45 phút.',
        timestamp: '2026-10-18T08:30:00Z',
        actor: 'Alex Morgan',
      },
    ],
  },
  {
    id: 'CR-2026-082',
    consultantId: '2',
    consultantName: 'Taylor Lee',
    topic: 'CAREER_ORIENTATION',
    topicLabel: 'Chiến lược Chuyển ngành sang AI / ML Engineer',
    priority: 'HIGH',
    status: 'SCHEDULED',
    requestedAt: '2026-10-17T11:00:00Z',
    targetGoal: 'Chuyển đổi suôn sẻ từ Backend Java sang AI Application & LLM Integration Engineer',
    candidateNotes:
      'Em có 3.5 năm làm Backend Java (Spring Boot, Microservices, Kafka). Gần đây em đã hoàn thành khóa học Deep Learning, làm dự án RAG với LangChain và Python. Em muốn tham vấn lộ trình xin việc AI Engineer ở thị trường Việt Nam hiện nay.',
    candidateQuestions: [
      'Liệu kinh nghiệm Backend Microservices có được nhà tuyển dụng AI đánh giá cao không hay phải bắt đầu lại từ Junior?',
      'Nên chọn hướng AI Application Engineer (RAG, Agents, LLMOps) hay hướng Core Model Research?',
      'Mức lương kỳ vọng hợp lý khi chuyển đổi chuyên môn là bao nhiêu?',
    ],
    currentObstacles:
      'Chưa có kinh nghiệm thực chiến mô hình lớn trên môi trường production thực tế của doanh nghiệp, mới chỉ dừng ở PoC cá nhân.',
    candidate: {
      id: 'c-102',
      name: 'Trần Minh Đức',
      email: 'duc.tran@example.com',
      phone: '+84 903 888 999',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      location: 'Hà Nội, Việt Nam',
      currentTitle: 'Backend Java Developer',
      targetRole: 'AI Engineer / LLMOps Specialist',
      experienceLevel: 'Mid-level (3.5 năm)',
      yearsOfExperience: 3.5,
      topSkills: ['Java', 'Spring Boot', 'Python', 'FastAPI', 'LangChain', 'PostgreSQL', 'Docker'],
      attachedResumeId: 'res-duc-01',
      attachedResumeName: 'Tran_Minh_Duc_Backend_AI_CV.pdf',
      attachedResumeScore: 78,
      linkedIn: 'https://linkedin.com/in/duc-tran-ai',
      github: 'https://github.com/ductran-java-ai',
      bio: 'Backend Engineer hướng đến tương lai tự động hóa thông minh với Generative AI và Agentic Workflows.',
    },
    meeting: {
      platform: 'Google Meet',
      meetingUrl: 'https://meet.google.com/duc-aiml-2026',
      meetingCode: 'duc-aiml-2026',
      scheduledAt: '2026-10-19T16:00:00Z',
      durationMinutes: 45,
    },
    evaluationRubric: {
      cvQuality: 7,
      technicalDepth: 8,
      communication: 9,
      marketReadiness: 7,
    },
    consultantPrivateNotes:
      'Đức có nền tảng Backend vững là một lợi thế cực lớn cho mảng AI Systems Engineer / LLMOps. Rất nhiều công ty AI đang khát người biết dựng backend chịu tải cao để deploy model.',
    messages: [
      {
        id: 'msg-082-1',
        senderId: 'c-102',
        senderName: 'Trần Minh Đức',
        senderRole: 'CANDIDATE',
        content: 'Em chào Chuyên gia! Em đã chuẩn bị sẵn sơ đồ kiến trúc dự án RAG cá nhân để nhờ Chuyên gia góp ý trong buổi họp chiều nay.',
        timestamp: '2026-10-18T14:10:00Z',
      },
      {
        id: 'msg-082-2',
        senderId: '2',
        senderName: 'Taylor Lee',
        senderRole: 'CAREER_CONSULTANT',
        content: 'Chào Đức! Rất tuyệt vời. Thầy đã xem qua profile của em. Chiều nay chúng ta sẽ bàn sâu về cách định vị "Backend-Heavy AI Engineer" - đây là profile các công ty săn đón mạnh nhất hiện nay nhé.',
        timestamp: '2026-10-18T15:00:00Z',
      },
    ],
    timeline: [
      {
        id: 'tl-082-1',
        status: 'PENDING',
        title: 'Yêu cầu được gửi',
        description: 'Ứng viên gửi yêu cầu tư vấn định hướng chuyên ngành.',
        timestamp: '2026-10-17T11:00:00Z',
        actor: 'Trần Minh Đức',
      },
      {
        id: 'tl-082-2',
        status: 'SCHEDULED',
        title: 'Chuyên gia đã xác nhận lịch tư vấn',
        description: 'Chuyên gia Taylor Lee duyệt buổi tư vấn trực tuyến qua Google Meet.',
        timestamp: '2026-10-17T14:20:00Z',
        actor: 'Taylor Lee',
      },
    ],
  },
  {
    id: 'CR-2026-083',
    consultantId: '2',
    consultantName: 'Taylor Lee',
    topic: 'MOCK_INTERVIEW',
    topicLabel: 'Phỏng vấn Thử: Technical Architecture & System Design',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    requestedAt: '2026-10-16T09:15:00Z',
    targetGoal: 'Vượt qua vòng phỏng vấn System Design & Leadership cho vị trí Frontend Architect tại SEA Group',
    candidateNotes:
      'Em có lịch phỏng vấn chính thức vào thứ 5 tuần này. Vòng này gồm 45 phút thiết kế kiến trúc Micro-frontends quy mô 5 triệu người dùng hoạt động hàng ngày và 15 phút câu hỏi tình huống văn hóa quản lý đội ngũ.',
    candidateQuestions: [
      'Chiến lược trả lời System Design từ High-level xuống Deep-dive chi tiết như thế nào để không bị cháy thời gian?',
      'Cách xử lý các câu hỏi bẫy về trade-off giữa Monorepo vs Polyrepo, SSR vs SPA?',
      'Cách trả lời các câu hỏi tình huống mâu thuẫn ý kiến kỹ thuật giữa các team members?',
    ],
    currentObstacles:
      'Thường có xu hướng nhảy thẳng vào công nghệ cụ thể (code detail) thay vì phân tích yêu cầu phi chức năng (Availability, Latency, Consistency) trước.',
    candidate: {
      id: 'c-103',
      name: 'Lê Hoàng Yến',
      email: 'yen.le@example.com',
      phone: '+84 987 654 321',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      location: 'Đà Nẵng, Việt Nam',
      currentTitle: 'Senior Frontend Developer',
      targetRole: 'Frontend Architect / Engineering Manager',
      experienceLevel: 'Senior (6 năm)',
      yearsOfExperience: 6.0,
      topSkills: ['System Design', 'Micro-frontends', 'Module Federation', 'TypeScript', 'Web Security', 'Team Leadership'],
      attachedResumeId: 'res-yen-01',
      attachedResumeName: 'Le_Hoang_Yen_Frontend_Lead_CV.pdf',
      attachedResumeScore: 92,
      linkedIn: 'https://linkedin.com/in/yen-le-tech',
      github: 'https://github.com/yenle-architect',
      bio: 'Chuyên gia xây dựng hệ thống Frontend quy mô doanh nghiệp, người sáng lập cộng đồng Đà Nẵng Web Engineers.',
    },
    meeting: {
      platform: 'Google Meet',
      meetingUrl: 'https://meet.google.com/yen-mock-sysdesign',
      meetingCode: 'yen-mock-sysdesign',
      scheduledAt: '2026-10-19T10:00:00Z',
      durationMinutes: 60,
    },
    evaluationRubric: {
      cvQuality: 9,
      technicalDepth: 9,
      communication: 9,
      marketReadiness: 9,
    },
    consultantPrivateNotes:
      'Đang trong buổi phỏng vấn thử. Yến trả lời phần Micro-frontends rất sâu. Nhắc Yến nhấn mạnh thêm khía cạnh Shared State và Versioning strategy khi nhiều squad cùng deploy độc lập.',
    messages: [
      {
        id: 'msg-083-1',
        senderId: 'c-103',
        senderName: 'Lê Hoàng Yến',
        senderRole: 'CANDIDATE',
        content: 'Chuyên gia ơi, em đã vào phòng Google Meet rồi ạ!',
        timestamp: '2026-10-19T09:58:00Z',
      },
      {
        id: 'msg-083-2',
        senderId: '2',
        senderName: 'Taylor Lee',
        senderRole: 'CAREER_CONSULTANT',
        content: 'Chào Yến, anh đang kết nối mic và màn hình, vào ngay đây nhé!',
        timestamp: '2026-10-19T09:59:30Z',
      },
    ],
    timeline: [
      {
        id: 'tl-083-1',
        status: 'PENDING',
        title: 'Gửi yêu cầu phỏng vấn thử',
        description: 'Ứng viên gửi yêu cầu mock interview chuyên sâu về System Design.',
        timestamp: '2026-10-16T09:15:00Z',
        actor: 'Lê Hoàng Yến',
      },
      {
        id: 'tl-083-2',
        status: 'SCHEDULED',
        title: 'Lịch phỏng vấn được chốt',
        description: 'Chuyên gia Taylor Lee chấp thuận buổi mock interview 60 phút.',
        timestamp: '2026-10-16T10:00:00Z',
        actor: 'Taylor Lee',
      },
      {
        id: 'tl-083-3',
        status: 'IN_PROGRESS',
        title: 'Buổi tư vấn đang diễn ra',
        description: 'Phiên phỏng vấn thử qua Google Meet đang được thực hiện.',
        timestamp: '2026-10-19T10:00:00Z',
        actor: 'Hệ thống',
      },
    ],
  },
  {
    id: 'CR-2026-084',
    consultantId: '2',
    consultantName: 'Taylor Lee',
    topic: 'SALARY_NEGOTIATION',
    topicLabel: 'Định giá Năng lực & Chiến lược Đàm phán Offer',
    priority: 'NORMAL',
    status: 'COMPLETED',
    requestedAt: '2026-10-14T14:00:00Z',
    targetGoal: 'So sánh và đàm phán 2 gói Offer từ VNG Tech và KMS Technology cho vị trí Lead Fullstack',
    candidateNotes:
      'Em vừa nhận được 2 offer: Offer 1 từ VNG: Base 55M + Performance Bonus 3 tháng + Stock options. Offer 2 từ KMS: Base 65M Net + Bảo hiểm gia đình cao cấp. Em băn khoăn về bài toán thuế, lộ trình thăng tiến và cách thương lượng thêm sign-on bonus.',
    candidateQuestions: [
      'Công thức quy đổi Tổng thu nhập năm (Total Compensation - TC) giữa Base cao vs Thưởng cổ phần?',
      'Cách gửi email phản hồi chuyên nghiệp để đề xuất tăng thêm 10% base salary mà không làm phật lòng HR?',
    ],
    currentObstacles: 'Ngại đàm phán vì sợ công ty rút lại offer.',
    candidate: {
      id: 'c-104',
      name: 'Đặng Thanh Tùng',
      email: 'tung.dang@example.com',
      phone: '+84 934 112 233',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      location: 'Hồ Chí Minh, Việt Nam',
      currentTitle: 'Senior Fullstack Engineer',
      targetRole: 'Lead Fullstack Developer',
      experienceLevel: 'Lead (5+ năm)',
      yearsOfExperience: 5.2,
      topSkills: ['Go', 'Node.js', 'React', 'PostgreSQL', 'Kubernetes', 'Cloud Architecture'],
      attachedResumeId: 'res-tung-01',
      attachedResumeName: 'Dang_Thanh_Tung_Lead_Fullstack.pdf',
      attachedResumeScore: 90,
      linkedIn: 'https://linkedin.com/in/tung-dang-fullstack',
      bio: 'Kỹ sư Fullstack với kinh nghiệm xây dựng hệ thống thanh toán và e-wallet phục vụ hàng triệu người dùng.',
    },
    meeting: {
      platform: 'Google Meet',
      meetingUrl: 'https://meet.google.com/tung-offer-done',
      meetingCode: 'tung-offer-done',
      scheduledAt: '2026-10-15T15:00:00Z',
      durationMinutes: 45,
    },
    evaluationRubric: {
      cvQuality: 9,
      technicalDepth: 9,
      communication: 9,
      marketReadiness: 10,
    },
    consultantPrivateNotes:
      'Tùng có vị thế đàm phán rất mạnh nhờ có 2 offer song song. Đã hướng dẫn mẫu email "Competing Offer Leverage". Tùng đã chốt thành công tăng 8% base tại VNG cùng 50M sign-on bonus.',
    feedback: {
      summary:
        'Buổi tư vấn đạt kết quả xuất sắc. Đã cùng ứng viên phân tích chi tiết bảng Total Compensation (TC) của cả 2 bên. Cung cấp bộ khung email đàm phán lịch thiệp và chiến thuật neo giá hiệu quả.',
      overallRating: 10,
      strengths: [
        'Hồ sơ kỹ thuật mạnh, năng lực thực chiến cao nên có độ tín nhiệm lớn với Hiring Manager.',
        'Thấu hiểu rõ giá trị bản thân mang lại cho dự án của công ty tuyển dụng.',
      ],
      improvements: [
        'Cần lưu ý thêm các điều khoản về thời gian vesting cổ phiếu (Cliff 1 năm) trong hợp đồng.',
        'Cân nhắc các quyền lợi phi tài chính như ngân sách học tập (Training budget) và ngày phép năm.',
      ],
      actionChecklist: [
        { id: 'ac-1', task: 'Soạn email phản hồi HR theo template đàm phán cạnh tranh', completed: true },
        { id: 'ac-2', task: 'Yêu cầu HR gửi văn bản chi tiết về cơ chế tính KPI bonus', completed: true },
        { id: 'ac-3', task: 'Kiểm tra kỹ điều khoản Non-Compete Agreement trước khi ký', completed: true },
      ],
      recommendedResources: [
        {
          title: 'Chiến thuật đàm phán Lương ngành Công nghệ theo Levels.fyi Framework',
          type: 'Article',
          url: 'https://careerpilot.demo/resources/salary-negotiation-guide',
          provider: 'CareerPilot Editorial',
        },
      ],
      nextFollowUpDate: '2026-11-15T00:00:00Z',
      submittedAt: '2026-10-15T16:15:00Z',
      updatedAt: '2026-10-15T16:15:00Z',
    },
    ratingByCandidate: {
      stars: 5,
      comment:
        'Lời khuyên của Chuyên gia Taylor Lee cực kỳ đắt giá! Em đã áp dụng mẫu email và thành công nâng mức đãi ngộ lên đúng như kỳ vọng ban đầu. Rất cảm ơn anh!',
      createdAt: '2026-10-16T08:00:00Z',
    },
    messages: [
      {
        id: 'msg-084-1',
        senderId: '2',
        senderName: 'Taylor Lee',
        senderRole: 'CAREER_CONSULTANT',
        content: 'Chào Tùng, anh gửi kèm bản tổng hợp phân tích Total Compensation và mẫu thư phản hồi nhé.',
        timestamp: '2026-10-15T16:16:00Z',
      },
      {
        id: 'msg-084-2',
        senderId: 'c-104',
        senderName: 'Đặng Thanh Tùng',
        senderRole: 'CANDIDATE',
        content: 'Dạ em cảm ơn anh Taylor Lee nhiều ạ! Kết quả vượt cả mong đợi của em luôn rồi ạ.',
        timestamp: '2026-10-16T07:55:00Z',
      },
    ],
    timeline: [
      {
        id: 'tl-084-1',
        status: 'PENDING',
        title: 'Yêu cầu gửi đi',
        description: 'Ứng viên gửi hồ sơ xin tư vấn đàm phán offer.',
        timestamp: '2026-10-14T14:00:00Z',
        actor: 'Đặng Thanh Tùng',
      },
      {
        id: 'tl-084-2',
        status: 'SCHEDULED',
        title: 'Lịch họp được duyệt',
        description: 'Chuyên gia xếp lịch họp chiều 15/10.',
        timestamp: '2026-10-14T15:30:00Z',
        actor: 'Taylor Lee',
      },
      {
        id: 'tl-084-3',
        status: 'IN_PROGRESS',
        title: 'Tiến hành buổi tư vấn',
        description: 'Phân tích bảng lương và tính thuế TNCN.',
        timestamp: '2026-10-15T15:00:00Z',
        actor: 'Taylor Lee & Ứng viên',
      },
      {
        id: 'tl-084-4',
        status: 'COMPLETED',
        title: 'Hoàn thành & Gửi Action Plan',
        description: 'Chuyên gia gửi kế hoạch hành động và nhận đánh giá 5 sao từ ứng viên.',
        timestamp: '2026-10-15T16:15:00Z',
        actor: 'Taylor Lee',
      },
    ],
  },
  {
    id: 'CR-2026-085',
    consultantId: '2',
    consultantName: 'Taylor Lee',
    topic: 'SKILL_ROADMAP',
    topicLabel: 'Xây dựng Lộ trình Kỹ năng & Lỗ hổng Công nghệ',
    priority: 'NORMAL',
    status: 'SCHEDULED',
    requestedAt: '2026-10-17T16:30:00Z',
    targetGoal: 'Chuyển đổi từ UI/UX Designer sang Technical Product Manager (TPM)',
    candidateNotes:
      'Em làm UI/UX được 3 năm, đã có chứng chỉ Scrum Master PSM I. Em muốn hiểu sâu hơn về tư duy kiến trúc API, Database và Data Analytics để tự tin làm việc với team Dev khi nhận vai trò Product Manager.',
    candidateQuestions: [
      'Một TPM xuất thân Designer cần học sâu đến mức nào về System Architecture?',
      'Khóa học hay chứng chỉ nào thực sự có giá trị trong mắt Head of Product?',
      'Cách xây dựng Product Portfolio cá nhân để gây ấn tượng?',
    ],
    currentObstacles: 'Chưa có nền tảng viết code nên đôi khi ngợp trước các thuật ngữ hạ tầng kỹ thuật.',
    candidate: {
      id: 'c-105',
      name: 'Phạm Thu Hà',
      email: 'ha.pham@example.com',
      phone: '+84 918 223 344',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      location: 'Hà Nội, Việt Nam',
      currentTitle: 'Senior UI/UX Designer',
      targetRole: 'Technical Product Manager',
      experienceLevel: 'Mid-Senior (3 năm)',
      yearsOfExperience: 3.0,
      topSkills: ['Figma', 'User Research', 'Design Systems', 'Scrum/Agile', 'Product Discovery'],
      attachedResumeId: 'res-ha-01',
      attachedResumeName: 'Pham_Thu_Ha_Product_Resume.pdf',
      attachedResumeScore: 81,
      linkedIn: 'https://linkedin.com/in/ha-pham-design',
      bio: 'Product Designer với niềm say mê mang trải nghiệm người dùng tinh tế gắn liền với giá trị kinh doanh bền vững.',
    },
    meeting: {
      platform: 'Google Meet',
      meetingUrl: 'https://meet.google.com/ha-pm-roadmap',
      meetingCode: 'ha-pm-roadmap',
      scheduledAt: '2026-10-21T15:00:00Z',
      durationMinutes: 45,
    },
    evaluationRubric: {
      cvQuality: 8,
      technicalDepth: 6,
      communication: 9,
      marketReadiness: 7,
    },
    consultantPrivateNotes:
      'Hà có tư duy sản phẩm và thấu hiểu người dùng rất nhạy bén. Buổi tới sẽ vạch lộ trình 3 tháng học: SQL nâng cao, RESTful API design fundamentals, và Data-driven A/B testing metrics.',
    messages: [
      {
        id: 'msg-085-1',
        senderId: 'c-105',
        senderName: 'Phạm Thu Hà',
        senderRole: 'CANDIDATE',
        content: 'Em đã chuẩn bị sẵn danh sách các khóa học em đang định đăng ký để nhờ Chuyên gia lọc giúp ạ.',
        timestamp: '2026-10-18T09:00:00Z',
      },
    ],
    timeline: [
      {
        id: 'tl-085-1',
        status: 'PENDING',
        title: 'Yêu cầu được gửi',
        description: 'Ứng viên gửi mong muốn tư vấn lộ trình học tập TPM.',
        timestamp: '2026-10-17T16:30:00Z',
        actor: 'Phạm Thu Hà',
      },
      {
        id: 'tl-085-2',
        status: 'SCHEDULED',
        title: 'Đã xếp lịch tư vấn',
        description: 'Chuyên gia xếp lịch họp vào ngày 21/10.',
        timestamp: '2026-10-18T10:15:00Z',
        actor: 'Taylor Lee',
      },
    ],
  },
  {
    id: 'CR-2026-086',
    consultantId: '2',
    consultantName: 'Taylor Lee',
    topic: 'CV_REVIEW',
    topicLabel: 'Sửa CV Đầu tay & Chuẩn bị Dự án Portfolio',
    priority: 'NORMAL',
    status: 'PENDING',
    requestedAt: '2026-10-18T18:00:00Z',
    targetGoal: 'Ứng tuyển thành công chương trình Fresher/Junior Data Analyst tại các tập đoàn bán lẻ & ngân hàng',
    candidateNotes:
      'Em là sinh viên năm cuối chuyên ngành Hệ thống Thông tin. CV của em mới có điểm ATS 68/100, bị báo lỗi thiếu từ khóa kinh doanh và định dạng bảng chưa tương thích phần mềm quét CV. Em cần Chuyên gia hướng dẫn cách sửa format và chọn dự án đồ án tốt nghiệp đưa vào CV.',
    candidateQuestions: [
      'Làm thế nào để sinh viên mới ra trường chứng minh năng lực khi chưa có kinh nghiệm làm việc chính thức?',
      'Dự án PowerBI / SQL cá nhân nên trình bày như thế nào trên CV để không bị xem là bài tập thông thường?',
    ],
    currentObstacles: 'Chưa có kinh nghiệm thực tế, CV dùng bảng biểu phức tạp khiến máy quét ATS bị lỗi parse chữ.',
    candidate: {
      id: 'c-106',
      name: 'Vũ Quốc Bảo',
      email: 'bao.vu@example.com',
      phone: '+84 971 556 677',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      location: 'Hồ Chí Minh, Việt Nam',
      currentTitle: 'Fresher Data Analyst',
      targetRole: 'Junior Business Intelligence / Data Analyst',
      experienceLevel: 'Fresher (< 1 năm)',
      yearsOfExperience: 0.5,
      topSkills: ['SQL', 'Python', 'Power BI', 'Tableau', 'Excel Advanced', 'Data Cleaning'],
      attachedResumeId: 'res-bao-01',
      attachedResumeName: 'Vu_Quoc_Bao_Data_Analyst_Fresher.pdf',
      attachedResumeScore: 68,
      github: 'https://github.com/baovu-data',
      bio: 'Tốt nghiệp cử nhân CNTT Đại học FPT, đam mê khám phá giá trị tiềm ẩn từ dữ liệu kinh doanh.',
    },
    meeting: {
      platform: 'Google Meet',
      meetingUrl: 'https://meet.google.com/bao-cv-review',
      meetingCode: 'bao-cv-review',
      scheduledAt: '2026-10-20T10:30:00Z',
      durationMinutes: 45,
    },
    evaluationRubric: {
      cvQuality: 6,
      technicalDepth: 7,
      communication: 7,
      marketReadiness: 6,
    },
    consultantPrivateNotes:
      'Hồ sơ của Bảo cần chuẩn hóa sang mẫu Standard Single-column ATS, loại bỏ bảng chia cột 2 bên. Đồ án về phân tích churn khách hàng thương mại điện tử rất tiềm năng, chỉ cần viết lại theo STAR.',
    messages: [],
    timeline: [
      {
        id: 'tl-086-1',
        status: 'PENDING',
        title: 'Yêu cầu được gửi',
        description: 'Ứng viên gửi hồ sơ xin tư vấn CV Fresher.',
        timestamp: '2026-10-18T18:00:00Z',
        actor: 'Vũ Quốc Bảo',
      },
    ],
  },
  {
    id: 'CR-2026-087',
    consultantId: '2',
    consultantName: 'Taylor Lee',
    topic: 'MOCK_INTERVIEW',
    topicLabel: 'Phỏng vấn Thử DevOps & Cloud Infrastructure',
    priority: 'HIGH',
    status: 'COMPLETED',
    requestedAt: '2026-10-12T10:00:00Z',
    targetGoal: 'Phỏng vấn vị trí Senior DevOps / Platform Engineer tại công ty Outsourcing Nhật Bản',
    candidateNotes:
      'Ứng viên cần rèn luyện khả năng trả lời phỏng vấn kỹ thuật bằng tiếng Anh cho các tình huống sự cố Production (Disaster Recovery, High Traffic Spike trên Kubernetes).',
    candidateQuestions: [
      'Cách cấu trúc câu trả lời Incident Response theo chuẩn SRE (Site Reliability Engineering)?',
      'Cách giải thích kiến trúc Terraform đa môi trường (Multi-cloud) súc tích?',
    ],
    currentObstacles: 'Giao tiếp tiếng Anh kỹ thuật đôi khi còn ngập ngừng khi gặp câu hỏi bất ngờ.',
    candidate: {
      id: 'c-107',
      name: 'Nguyễn Thị Mai Linh',
      email: 'linh.mai@example.com',
      phone: '+84 945 990 011',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      location: 'Hà Nội, Việt Nam',
      currentTitle: 'DevOps Engineer',
      targetRole: 'Senior DevOps / SRE',
      experienceLevel: 'Senior (4 năm)',
      yearsOfExperience: 4.0,
      topSkills: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD GitHub Actions', 'Prometheus/Grafana'],
      attachedResumeId: 'res-linh-01',
      attachedResumeName: 'Mai_Linh_DevOps_Engineer.pdf',
      attachedResumeScore: 88,
      linkedIn: 'https://linkedin.com/in/mai-linh-devops',
      github: 'https://github.com/mailinh-k8s',
      bio: 'DevOps Engineer tận tụy với tự động hóa hạ tầng đám mây và nâng cao độ tin cậy của dịch vụ 99.99%.',
    },
    meeting: {
      platform: 'Google Meet',
      meetingUrl: 'https://meet.google.com/linh-devops-done',
      meetingCode: 'linh-devops-done',
      scheduledAt: '2026-10-13T14:00:00Z',
      durationMinutes: 45,
    },
    evaluationRubric: {
      cvQuality: 9,
      technicalDepth: 9,
      communication: 8,
      marketReadiness: 9,
    },
    feedback: {
      summary:
        'Linh thể hiện kiến thức Kubernetes và GitOps rất chắc chắn. Đã hướng dẫn Linh phương pháp "Situation - Impact - Resolution - Post-mortem" để trả lời trôi chảy các câu hỏi tình huống Incident Response bằng tiếng Anh.',
      overallRating: 9,
      strengths: [
        'Nắm rất rõ cơ chế Autoscaling (HPA, KEDA) và Logging/Monitoring.',
        'Thái độ tiếp thu nhanh, áp dụng được ngay các chỉnh sửa ngữ điệu tiếng Anh trong buổi mock.',
      ],
      improvements: [
        'Cần mở đầu câu trả lời bằng bức tranh tổng thể trước khi đi vào giải thích cấu hình YAML chi tiết.',
        'Học thêm các từ khóa chuyên ngành SRE như SLI, SLO, Error Budget.',
      ],
      actionChecklist: [
        { id: 'ac-linh-1', task: 'Học thuộc template 5 bước Incident Response SRE', completed: true },
        { id: 'ac-linh-2', task: 'Ghi âm lại 3 câu trả lời tiếng Anh mẫu và nghe lại để chỉnh phát âm', completed: true },
      ],
      recommendedResources: [
        {
          title: 'Google SRE Book - Managing Incidents Practice',
          type: 'Book',
          url: 'https://sre.google/sre-book/table-of-contents/',
          provider: 'Google Site Reliability Engineering',
        },
      ],
      submittedAt: '2026-10-13T15:10:00Z',
    },
    ratingByCandidate: {
      stars: 5,
      comment:
        'Buổi mock interview với anh Taylor Lee đã giúp em giải tỏa hoàn toàn áp lực phỏng vấn tiếng Anh. Em đã nhận được offer tuần qua rồi ạ!',
      createdAt: '2026-10-14T09:30:00Z',
    },
    messages: [],
    timeline: [
      {
        id: 'tl-087-1',
        status: 'COMPLETED',
        title: 'Hoàn tất buổi tư vấn',
        description: 'Buổi phỏng vấn thử hoàn thành xuất sắc.',
        timestamp: '2026-10-13T15:10:00Z',
        actor: 'Taylor Lee',
      },
    ],
  },
  {
    id: 'CR-2026-088',
    consultantId: '2',
    consultantName: 'Taylor Lee',
    topic: 'CAREER_ORIENTATION',
    topicLabel: 'Định hướng Thăng tiến lên Solution Architect',
    priority: 'NORMAL',
    status: 'CANCELLED',
    requestedAt: '2026-10-11T09:00:00Z',
    targetGoal: 'Chuẩn bị lộ trình thi chứng chỉ AWS Certified Solutions Architect Professional',
    candidateNotes: 'Ứng viên xin hủy lịch do công ty có dự án Go-Live khẩn cấp, xin hẹn lại sang tháng sau.',
    candidateQuestions: [],
    currentObstacles: 'Bận lịch công tác đột xuất.',
    candidate: {
      id: 'c-108',
      name: 'Bùi Gia Huy',
      email: 'huy.bui@example.com',
      phone: '+84 909 778 899',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      location: 'Hồ Chí Minh, Việt Nam',
      currentTitle: 'Senior Node.js Developer',
      targetRole: 'Cloud Solution Architect',
      experienceLevel: 'Senior (5 năm)',
      yearsOfExperience: 5.0,
      topSkills: ['Node.js', 'NestJS', 'AWS', 'Microservices', 'System Architecture'],
      attachedResumeName: 'Bui_Gia_Huy_Nodejs.pdf',
      attachedResumeScore: 83,
    },
    meeting: {
      platform: 'Google Meet',
      meetingUrl: 'https://meet.google.com/huy-cancelled',
      meetingCode: 'huy-cancelled',
      scheduledAt: '2026-10-12T16:00:00Z',
      durationMinutes: 45,
    },
    messages: [],
    timeline: [
      {
        id: 'tl-088-1',
        status: 'CANCELLED',
        title: 'Buổi tư vấn đã hủy',
        description: 'Ứng viên gửi thông báo bận lịch công tác đột xuất.',
        timestamp: '2026-10-12T08:00:00Z',
        actor: 'Bùi Gia Huy',
      },
    ],
  },
];

export const mockConsultantStats: ConsultantDashboardStats = {
  totalAssigned: 12,
  pendingCount: 2,
  scheduledCount: 3,
  inProgressCount: 1,
  completedCount: 5,
  cancelledCount: 1,
  satisfactionRate: 4.95,
  totalReviews: 48,
  avgResponseTime: '1.2 giờ',
  completionRate: 96,
  todaySessionsCount: 2,
  topicDistribution: [
    { topic: 'CV_REVIEW', label: 'Tối ưu hóa CV & ATS', count: 5, percentage: 42, color: 'bg-blue-500' },
    { topic: 'MOCK_INTERVIEW', label: 'Phỏng vấn thử chuyên sâu', count: 3, percentage: 25, color: 'bg-emerald-500' },
    { topic: 'CAREER_ORIENTATION', label: 'Định hướng & Chuyển ngành', count: 2, percentage: 17, color: 'bg-amber-500' },
    { topic: 'SALARY_NEGOTIATION', label: 'Định giá & Đàm phán lương', count: 1, percentage: 8, color: 'bg-purple-500' },
    { topic: 'SKILL_ROADMAP', label: 'Lộ trình kỹ năng & Gap', count: 1, percentage: 8, color: 'bg-pink-500' },
  ],
  weeklySchedule: [
    {
      date: '2026-10-19',
      dayOfWeek: 'Thứ 2 (Hôm nay)',
      count: 2,
      sessions: [
        { id: 'CR-2026-083', time: '10:00 - 11:00', candidateName: 'Lê Hoàng Yến', topic: 'Mock Interview Architecture' },
        { id: 'CR-2026-081', time: '14:30 - 15:15', candidateName: 'Alex Morgan', topic: 'Tối ưu CV Senior Frontend' },
      ],
    },
    {
      date: '2026-10-20',
      dayOfWeek: 'Thứ 3',
      count: 1,
      sessions: [
        { id: 'CR-2026-086', time: '10:30 - 11:15', candidateName: 'Vũ Quốc Bảo', topic: 'Sửa CV Fresher Data' },
      ],
    },
    {
      date: '2026-10-21',
      dayOfWeek: 'Thứ 4',
      count: 1,
      sessions: [
        { id: 'CR-2026-085', time: '15:00 - 15:45', candidateName: 'Phạm Thu Hà', topic: 'Lộ trình kỹ năng TPM' },
      ],
    },
    {
      date: '2026-10-22',
      dayOfWeek: 'Thứ 5',
      count: 0,
      sessions: [],
    },
    {
      date: '2026-10-23',
      dayOfWeek: 'Thứ 6',
      count: 1,
      sessions: [
        { id: 'CR-2026-082', time: '16:00 - 16:45', candidateName: 'Trần Minh Đức', topic: 'Định hướng AI Engineer' },
      ],
    },
  ],
};

export const mockAlexAdvice: ConsultationAdvicePillars = {
  lastUpdated: '2026-10-18T10:00:00Z',
  consultantName: 'Taylor Lee',
  cvAdvice: {
    summary:
      'Hồ sơ của Alex có kiến trúc nền tảng tốt. Điểm cần tối ưu hóa ngay: Phần Executive Summary chưa làm bật năng lực dẫn dắt kỹ thuật (Tech Lead) và các bullet points dự án còn mang tính liệt kê nhiệm vụ thay vì thành tựu đo lường được.',
    formattingTips: [
      'Giới hạn CV trong 2 trang chuẩn ATS định dạng Single-column rõ ràng.',
      'Dùng font chữ không chân dễ đọc (Inter, Roboto hoặc Calibri), cỡ chữ 10.5pt - 11pt.',
      'Đưa 6 công nghệ chủ lực (React 19, TypeScript, Next.js, TanStack Query, Tailwind, Performance) lên đầu trang 1.',
    ],
    starImprovements: [
      {
        id: 'star-alex-1',
        before: 'Phát triển các component React cho hệ thống thanh toán trực tuyến.',
        afterStar:
          'Tái cấu trúc 18+ core UI components bằng React 19 và Tailwind CSS, tích hợp Web Vitals giúp giảm LCP từ 3.4s xuống 1.1s, tăng tỷ lệ hoàn tất đơn hàng thêm 18.5%.',
        note: 'Bổ sung bối cảnh công nghệ (React 19), hành động tái cấu trúc và kết quả kinh doanh tăng 18.5%.',
      },
      {
        id: 'star-alex-2',
        before: 'Làm việc với team Backend để tích hợp REST API và GraphQL.',
        afterStar:
          'Thiết kế Data Access Layer với TanStack Query và TypeScript, giảm 45% thời gian chờ dữ liệu mạng và loại bỏ 100% runtime type mismatches.',
        note: 'Chứng minh tư duy kiến trúc và làm chủ độ tin cậy của mã nguồn.',
      },
      {
        id: 'star-alex-3',
        before: 'Tối ưu hóa tốc độ tải trang web và sửa lỗi giao diện.',
        afterStar:
          'Triển khai Dynamic Code Splitting và Modern Image Optimization, nâng điểm Google Lighthouse từ 62 lên 96/100 cho toàn bộ trang chủ.',
        note: 'Đo lường bằng chỉ số chuẩn quốc tế Google Lighthouse.',
      },
    ],
    missingKeywordsToInject: [
      'Core Web Vitals (LCP, INP, CLS)',
      'Module Federation / Micro-frontends',
      'CI/CD Pipeline Integration',
      'Server-Driven UI',
      'TanStack Query',
      'Design System Governance',
    ],
    actionItems: [
      'Viết lại 3 dự án trọng điểm theo công thức STAR trước ngày 22/10.',
      'Cập nhật lại phần Executive Summary định vị rõ Senior Frontend Architect.',
      'Quét lại hệ thống ATS Scanner để nâng điểm từ 84 lên trên 90 điểm.',
    ],
  },
  careerAdvice: {
    currentLevel: 'Mid-Senior Frontend Engineer (4.5 năm)',
    targetLevel: 'Lead Frontend Engineer / Frontend Architect',
    recommendedPositioning:
      'Định vị ứng viên là Frontend Architect chuyên sâu về Web Performance, High-Concurrency Web Apps và Design System quy mô lớn.',
    shortTermRoadmap: [
      'Tháng 1: Hoàn thiện dự án mẫu Micro-frontend (Module Federation) trên GitHub cá nhân.',
      'Tháng 2: Luyện sâu các chủ đề System Design cho Frontend (Streaming SSR, Hydration, Edge Computing).',
      'Tháng 3: Tham gia các buổi Mock Interview chuyên sâu và ứng tuyển vào các Tech Unicorns.',
    ],
    longTermRoadmap: [
      '6 tháng: Đảm nhiệm vai trò Tech Lead dẫn dắt nhóm 4-6 kỹ sư tại doanh nghiệp công nghệ lớn.',
      '12 tháng: Trở thành Principal / Staff Frontend Engineer với tầm ảnh hưởng về tiêu chuẩn công nghệ toàn công ty.',
    ],
    strategicRecommendations: [
      'Xây dựng thương hiệu cá nhân trên LinkedIn bằng các bài viết kỹ thuật ngắn về tối ưu Web Vitals.',
      'Đóng góp vào các thư viện mã nguồn mở React/TypeScript để làm nổi bật portfolio.',
    ],
  },
  salaryAdvice: {
    minSalary: 38000000,
    targetSalary: 52000000,
    maxSalary: 65000000,
    currency: 'VNĐ',
    marketPercentile: 'Top 15% thị trường (Senior 4-6 năm kinh nghiệm)',
    negotiationTactics: [
      'Sử dụng thế mạnh về React 19, Performance Optimization và chứng chỉ quốc tế để neo giá ở mức 50M - 55M VNĐ.',
      'Đàm phán gói đãi ngộ tổng thể (Total Compensation): Lương cứng + Thưởng hiệu suất (2-3 tháng) + ESOP.',
      'Đề xuất cam kết review lương tăng 15% sau 6 tháng nếu đạt các KPI về tối ưu Core Web Vitals.',
    ],
    compensationPackageTips: [
      'Yêu cầu mức Base Salary không dưới 45.000.000 VNĐ Net.',
      'Đàm phán phụ cấp trang thiết bị (MacBook Pro M3 Max) và chế độ làm việc Hybrid 2 ngày Remote/tuần.',
      'Chính sách bảo hiểm sức khỏe quốc tế cao cấp cho cá nhân và gia đình.',
    ],
    sampleScript:
      'Dựa trên năng lực giải quyết các bài toán tải cao và tối ưu Core Web Vitals đã được chứng minh qua các dự án thực tế, cùng với trách nhiệm dẫn dắt kỹ thuật tại vị trí này, mức lương 52.000.000 VNĐ kèm gói thưởng hiệu suất sẽ là mức đãi ngộ phù hợp để tôi đồng hành và tạo ra giá trị đột phá lâu dài cho công ty.',
  },
  interviewAdvice: {
    overallReadiness: 8.5,
    behavioralTips: [
      'Áp dụng phương pháp STAR khi trả lời câu hỏi về giải quyết bất đồng kỹ thuật với Product Manager.',
      'Nhấn mạnh vào tinh thần sở hữu (Ownership) và tư duy lấy người dùng làm trung tâm (User-centric).',
      'Tuyệt đối không chỉ trích quyết định kiến trúc của công ty cũ, hãy giải thích dưới góc độ bối cảnh và sự đánh đổi (Trade-offs).',
    ],
    technicalTips: [
      'Khi live-coding, luôn diễn giải to suy nghĩ (Think-out-loud) và hỏi rõ ràng các edge cases trước khi viết mã.',
      'Nắm chắc các câu hỏi về React Fiber Reconciliation, Memoization, và State Management patterns.',
      'Chuẩn bị kỹ phần System Design: CDN Caching, Asset Bundling, Hydration bottlenecks.',
    ],
    mockInterviewFeedback: [
      'Phần giải thích kiến trúc Component rất logic, rành mạch.',
      'Cần cải thiện tốc độ viết TypeScript types phức tạp dưới áp lực thời gian.',
    ],
    reverseQuestions: [
      'Team hiện đang giải quyết bài toán nợ kỹ thuật (Technical Debt) như thế nào trong chu kỳ Sprint?',
      'Thước đo thành công lớn nhất của vị trí Lead Frontend này sau 6 tháng đầu là gì?',
      'Văn hóa phản biện kỹ thuật (Design Review / Code Review) trong công ty diễn ra như thế nào?',
    ],
    pitfallsToAvoid: [
      'Tránh sa đà vào tranh cãi công nghệ mà quên mất mục tiêu kinh doanh của dự án.',
      'Tránh trả lời ngắn cụt lủn không có dẫn chứng số liệu thực tế.',
    ],
  },
};

export const mockDucAdvice: ConsultationAdvicePillars = {
  lastUpdated: '2026-10-17T15:00:00Z',
  consultantName: 'Taylor Lee',
  cvAdvice: {
    summary:
      'Kinh nghiệm 3.5 năm Backend Java là nền móng cực kỳ vững chắc. Cần chỉnh sửa CV để làm nổi bật sự kết hợp giữa Backend chịu tải cao và năng lực AI Engineering (RAG, Vector DB, LangChain).',
    formattingTips: [
      'Tạo mục "AI & LLM Projects" riêng biệt ngay phía dưới kinh nghiệm Backend.',
      'Làm nổi bật các chỉ số độ trễ mô hình (P95 Latency), Vector indexing throughput.',
    ],
    starImprovements: [
      {
        id: 'star-duc-1',
        before: 'Xây dựng ứng dụng chat hỏi đáp tài liệu dùng mô hình OpenAI và LangChain.',
        afterStar:
          'Thiết kế kiến trúc RAG với FastAPI, Qdrant Vector DB và LangChain, đạt độ trễ phản hồi < 850ms trên tập tài liệu nội bộ 500,000 trang, độ chính xác Semantic Search đạt 92%.',
        note: 'Định lượng số trang tài liệu và độ trễ response time chuẩn production.',
      },
    ],
    missingKeywordsToInject: ['RAG Architecture', 'Vector Search (Milvus/Qdrant)', 'LLMOps', 'Prompt Evaluation', 'FastAPI'],
    actionItems: [
      'Hoàn thiện repo PoC RAG có CI/CD và Docker Compose deploy đầy đủ trên GitHub.',
      'Viết bài phân tích kỹ thuật về tối ưu Embedding Chunking Size trên Medium/LinkedIn.',
    ],
  },
  careerAdvice: {
    currentLevel: 'Mid-level Backend Java Developer',
    targetLevel: 'AI Systems Engineer / LLMOps Specialist',
    recommendedPositioning:
      'Chuyên gia phát triển hệ thống AI ứng dụng (AI Systems / LLM Platform Engineer) với thế mạnh kiến trúc Backend vững chắc.',
    shortTermRoadmap: [
      'Tháng 1-2: Chinh phục mô hình Agentic AI (CrewAI, LangGraph) kết hợp bảo mật Guardrails.',
      'Tháng 3: Xây dựng portfolio 2 dự án AI hoàn chỉnh có demo online.',
    ],
    longTermRoadmap: [
      '1 năm: Trở thành Senior AI Application Architect, dẫn dắt các giải pháp GenAI doanh nghiệp.',
    ],
    strategicRecommendations: [
      'Định vị là kỹ sư AI biết làm Backend quy mô lớn, đây là tệp nhân sự hiếm hoi thị trường đang săn đón.',
    ],
  },
  salaryAdvice: {
    minSalary: 32000000,
    targetSalary: 42000000,
    maxSalary: 55000000,
    currency: 'VNĐ',
    marketPercentile: 'Top 25% thị trường (Chuyển ngành có nền tảng vững)',
    negotiationTactics: [
      'Tập trung vào giá trị Backend Microservices đã có: công ty không cần tuyển 2 người riêng biệt (1 Backend + 1 AI).',
      'Đề xuất mức lương sàn 38M đi kèm cam kết đánh giá lại sau 6 tháng.',
    ],
    compensationPackageTips: [
      'Xin ngân sách tham dự các hội nghị AI quốc tế hoặc chi phí tài khoản OpenAI/Cloud GPU.',
    ],
    sampleScript:
      'Với năng lực kết hợp vững chắc giữa Backend chịu tải cao và kiến trúc AI RAG thực chiến, tôi có thể đưa các giải pháp GenAI vào vận hành ngay mà không tốn chi phí đồng bộ giữa các team, mức lương 42.000.000 VNĐ là hợp lý với giá trị này.',
  },
  interviewAdvice: {
    overallReadiness: 7.8,
    behavioralTips: [
      'Giải thích lý do chuyển sang AI xuất phát từ sự say mê công nghệ và mong muốn giải quyết các bài toán dữ liệu lớn hơn.',
    ],
    technicalTips: [
      'Chuẩn bị kỹ phần Trade-off giữa Fine-tuning và RAG.',
      'Nắm chắc kiến trúc Vector Indexing (HNSW vs IVF).',
    ],
    mockInterviewFeedback: [
      'Tư duy Backend sắc bén, cần trau dồi thêm về các kỹ thuật đo lường ảo giác mô hình (Hallucination detection).',
    ],
    reverseQuestions: [
      'Doanh nghiệp hiện đang đo lường ROI của các dự án AI triển khai nội bộ như thế nào?',
    ],
    pitfallsToAvoid: [
      'Tránh lạm dụng lý thuyết toán học trừu tượng mà bỏ quên tính thực tiễn khi deploy sản phẩm.',
    ],
  },
};

export function generateMockConsultationAdvice(
  candidateName: string,
  targetRole: string,
  topic: ConsultationTopic
): ConsultationAdvicePillars {
  const isSalary = topic === 'SALARY_NEGOTIATION';
  const isInterview = topic === 'MOCK_INTERVIEW';

  return {
    lastUpdated: new Date().toISOString(),
    consultantName: 'Taylor Lee',
    cvAdvice: {
      summary: `Hồ sơ của ${candidateName} có định hướng rõ nét vào vị trí ${targetRole}. Cần tiếp tục tối ưu hóa mật độ từ khóa chuẩn ngành và đưa thêm số liệu đo lường theo công thức STAR.`,
      formattingTips: [
        'Chuẩn hóa cấu trúc Single-column để máy quét ATS đọc dữ liệu mượt mà.',
        'Sử dụng font chữ chuẩn quốc tế (Inter, Roboto, Arial) cỡ 10.5pt.',
        'Đưa kỹ năng cốt lõi và các công nghệ chủ đạo lên phần đầu tiên của hồ sơ.',
      ],
      starImprovements: [
        {
          id: `star-${Date.now()}-1`,
          before: `Thực hiện các công việc chuyên môn liên quan đến ${targetRole}.`,
          afterStar: `Chủ trì xây dựng giải pháp trọng điểm cho vị trí ${targetRole}, cải thiện 30% hiệu năng vận hành và giảm thiểu 25% chi phí phát sinh.`,
          note: 'Bổ sung số liệu phần trăm và hiệu quả giải quyết vấn đề.',
        },
      ],
      missingKeywordsToInject: ['System Optimization', 'Agile / Scrum', 'CI/CD Automation', 'Technical Documentation'],
      actionItems: [
        'Rà soát và chuẩn hóa lại các thành tựu theo phương pháp STAR.',
        'Tối ưu các tiêu đề phần theo chuẩn tiếng Anh chuyên ngành.',
      ],
    },
    careerAdvice: {
      currentLevel: 'Professional Specialist',
      targetLevel: targetRole,
      recommendedPositioning: `Định vị ${candidateName} là chuyên gia giàu năng lực thực thi và sở hữu tư duy giải quyết vấn đề vượt trội trong mảng ${targetRole}.`,
      shortTermRoadmap: [
        'Tháng 1-2: Bổ sung các chứng chỉ chuyên môn và hoàn thiện portfolio dự án thực tế.',
        'Tháng 3: Tham gia kết nối với các nhà tuyển dụng hàng đầu trong ngành.',
      ],
      longTermRoadmap: [
        '1-2 năm: Phát triển lên vai trò Lead / Chuyên gia cao cấp với tầm ảnh hưởng diện rộng.',
      ],
      strategicRecommendations: [
        'Duy trì sự hiện diện chuyên nghiệp trên LinkedIn và các cộng đồng công nghệ uy tín.',
      ],
    },
    salaryAdvice: {
      minSalary: isSalary ? 45000000 : 35000000,
      targetSalary: isSalary ? 55000000 : 45000000,
      maxSalary: isSalary ? 70000000 : 60000000,
      currency: 'VNĐ',
      marketPercentile: 'Top 20% thị trường theo kinh nghiệm tương đương',
      negotiationTactics: [
        'Tập trung đàm phán dựa trên giá trị giải quyết vấn đề đã được kiểm chứng thực tế.',
        'Thương lượng gói đãi ngộ toàn diện bao gồm cả thưởng KPI và phúc lợi đào tạo.',
      ],
      compensationPackageTips: [
        'Yêu cầu mức lương cơ bản rõ ràng kèm các điều khoản đánh giá định kỳ sau 6 tháng.',
      ],
      sampleScript: `Dựa trên kinh nghiệm và đóng góp cụ thể mà tôi có thể mang lại ngay cho vị trí ${targetRole}, mức đãi ngộ khuyến nghị từ chuyên gia sẽ là nền tảng vững chắc để tôi gắn bó và cống hiến hết mình.`,
    },
    interviewAdvice: {
      overallReadiness: isInterview ? 8.5 : 8.0,
      behavioralTips: [
        'Trả lời súc tích theo cấu trúc STAR: Bối cảnh, Thử thách, Hành động của bạn, và Kết quả.',
        'Giữ thái độ cầu thị, tự tin và truyền tải năng lượng tích cực.',
      ],
      technicalTips: [
        'Lắng nghe kỹ câu hỏi, làm rõ các giả định trước khi đưa ra giải pháp kỹ thuật.',
        'Trình bày rõ các phương án đánh đổi (Trade-offs) giữa các cách tiếp cận.',
      ],
      mockInterviewFeedback: [
        'Khả năng diễn đạt tốt, phản xạ nhanh và tư duy có hệ thống.',
      ],
      reverseQuestions: [
        'Đội ngũ hiện đang đối mặt với thử thách kỹ thuật hoặc kinh doanh lớn nhất nào?',
        'Môi trường làm việc thúc đẩy sự sáng tạo và đổi mới của nhân viên ra sao?',
      ],
      pitfallsToAvoid: [
        'Tránh nói lan man hoặc không trả lời đúng trọng tâm câu hỏi của người phỏng vấn.',
      ],
    },
  };
}
