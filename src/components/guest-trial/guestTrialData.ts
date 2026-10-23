export interface DemoCvData {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  template: 'modern' | 'tech' | 'classic';
  atsScore: number;
  atsBreakdown: {
    formatting: number;
    keywords: number;
    impact: number;
    brevity: number;
  };
  summary: string;
  skills: string[];
  experience: {
    role: string;
    company: string;
    period: string;
    highlights: string[];
  }[];
  education: {
    degree: string;
    school: string;
    period: string;
    honors?: string;
  }[];
  atsStrengths: string[];
}

export const demoResumes: DemoCvData[] = [
  {
    id: 'demo-fe',
    name: 'Alex Trần',
    title: 'Senior Frontend Engineer',
    email: 'alex.tran@demo.careerpilot.io',
    phone: '+84 90 123 4567',
    location: 'TP. Hồ Chí Minh (Hybrid)',
    template: 'modern',
    atsScore: 94,
    atsBreakdown: {
      formatting: 98,
      keywords: 92,
      impact: 95,
      brevity: 91,
    },
    summary:
      'Kỹ sư Frontend với 4+ năm kinh nghiệm xây dựng các ứng dụng Web hiệu năng cao bằng React, Next.js và TypeScript. Đã dẫn dắt dự án tối ưu hoá Web Vitals giúp tăng 35% tốc độ tải trang cho 500,000+ người dùng hoạt động.',
    skills: [
      'React',
      'TypeScript',
      'Next.js',
      'Tailwind CSS',
      'Redux Toolkit',
      'Zustand',
      'Vite',
      'RESTful APIs',
      'Jest',
      'CI/CD Pipelines',
    ],
    experience: [
      {
        role: 'Senior Frontend Engineer',
        company: 'TechVision Corporation',
        period: '2023 – Hiện tại',
        highlights: [
          'Chuyển đổi kiến trúc sang Next.js App Router, giảm 28% thời gian tải trang và đạt 98 điểm Google Lighthouse.',
          'Thiết kế và phát triển Design System chung với 40+ React components tái sử dụng cho 4 sản phẩm chính.',
          'Hướng dẫn chuyên môn cho 5 kỹ sư junior, nâng cao tiêu chuẩn code review và kiểm thử tự động.',
        ],
      },
      {
        role: 'Frontend Developer',
        company: 'Innovate Solutions',
        period: '2021 – 2023',
        highlights: [
          'Xây dựng giao diện dashboard phân tích dữ liệu lớn thời gian thực bằng React và WebSockets.',
          'Tối ưu bundle size giảm 35% thông qua kỹ thuật code-splitting và lazy loading.',
        ],
      },
    ],
    education: [
      {
        degree: 'Cử nhân Công nghệ Thông tin (Khoa học Máy tính)',
        school: 'Đại học Khoa học Tự nhiên TP.HCM',
        period: '2017 – 2021',
        honors: 'Tốt nghiệp loại Giỏi · GPA 3.6/4.0',
      },
    ],
    atsStrengths: [
      'Chỉ số định lượng rõ ràng (% cải thiện, số người dùng, số lượng component)',
      'Từ khoá chuẩn ngành: Next.js, Web Vitals, Design System, Code-splitting',
      'Bố cục chuẩn máy quét ATS không bị lỗi bảng biểu hay hình ảnh che chữ',
    ],
  },
  {
    id: 'demo-ai',
    name: 'Minh Nguyễn',
    title: 'AI / Machine Learning Engineer',
    email: 'minh.nguyen@demo.careerpilot.io',
    phone: '+84 98 765 4321',
    location: 'Hà Nội / Remote',
    template: 'tech',
    atsScore: 89,
    atsBreakdown: {
      formatting: 95,
      keywords: 90,
      impact: 86,
      brevity: 88,
    },
    summary:
      'Kỹ sư Trí tuệ Nhân tạo chuyên sâu về Xử lý ngôn ngữ tự nhiên (NLP), Kiến trúc RAG và tinh chỉnh mô hình LLM. Có kinh nghiệm triển khai mô hình AI agent phục vụ doanh nghiệp trên nền tảng đám mây GCP và AWS.',
    skills: [
      'Python',
      'PyTorch',
      'Hugging Face',
      'LangChain',
      'FastAPI',
      'Docker',
      'Vector DB (Pinecone/Milvus)',
      'MLflow',
      'GCP BigQuery',
      'RAG Architecture',
    ],
    experience: [
      {
        role: 'AI Engineer',
        company: 'DataCore Intelligence',
        period: '2023 – Hiện tại',
        highlights: [
          'Thiết kế và triển khai pipeline Retrieval-Augmented Generation (RAG) phục vụ trả lời hỏi đáp tài liệu nội bộ, giảm độ trễ truy vấn 42%.',
          'Fine-tune các mô hình mã nguồn mở (Llama 3, Mistral) cho bài toán trích xuất thực thể pháp lý với độ chính xác F1 91%.',
          'Đóng gói API inference với FastAPI và Docker, tự động mở rộng theo lưu lượng thực tế.',
        ],
      },
      {
        role: 'Data Scientist Intern',
        company: 'AI Innovation Lab',
        period: '2022 – 2023',
        highlights: [
          'Xây dựng pipeline tiền xử lý dữ liệu tiếng Việt quy mô 5 triệu văn bản.',
          'Hỗ trợ huấn luyện mô hình phân loại cảm xúc khách hàng đạt độ chính xác 88%.',
        ],
      },
    ],
    education: [
      {
        degree: 'Kỹ sư Trí tuệ Nhân tạo',
        school: 'Đại học Bách Khoa',
        period: '2018 – 2022',
        honors: 'Học bổng sinh viên xuất sắc nghiên cứu AI',
      },
    ],
    atsStrengths: [
      'Bao phủ đầy đủ các kỹ năng thế hệ mới: RAG, LLM Fine-tuning, Vector DB',
      'Định dạng cấu trúc tối ưu cho các thuật toán quét từ khoá công nghệ',
      'Liên kết chặt chẽ giữa học thuật và triển khai thực tế',
    ],
  },
  {
    id: 'demo-pm',
    name: 'Linh Phạm',
    title: 'Product Manager (SaaS & Digital)',
    email: 'linh.pham@demo.careerpilot.io',
    phone: '+84 91 888 9999',
    location: 'Đà Nẵng / Toàn quốc',
    template: 'classic',
    atsScore: 91,
    atsBreakdown: {
      formatting: 96,
      keywords: 89,
      impact: 93,
      brevity: 87,
    },
    summary:
      'Quản lý sản phẩm (Product Manager) định hướng dữ liệu với 3+ năm kinh nghiệm phát triển sản phẩm B2B SaaS. Thành thạo quy trình Agile/Scrum, phân tích hành vi người dùng và tối ưu hoá tỷ lệ kích hoạt chuyển đổi.',
    skills: [
      'Product Strategy',
      'Agile / Scrum',
      'User Research',
      'Figma Wireframing',
      'SQL Data Querying',
      'A/B Testing',
      'Jira / Confluence',
      'Google Analytics 4',
      'Customer Journey Mapping',
    ],
    experience: [
      {
        role: 'Product Manager',
        company: 'SaaSify Platforms',
        period: '2023 – Hiện tại',
        highlights: [
          'Chịu trách nhiệm toàn trình lộ trình sản phẩm (Product Roadmap) cho phân hệ quản trị doanh nghiệp, đóng góp 24% doanh thu định kỳ năm (ARR).',
          'Tối ưu phễu người dùng thử nghiệm sang trả phí, nâng tỷ lệ chuyển đổi từ 6.8% lên 11.2%.',
          'Điều phối nhóm liên chức năng gồm 8 kỹ sư, 2 nhà thiết kế UX và 3 chuyên viên bán hàng.',
        ],
      },
      {
        role: 'Associate Product Manager',
        company: 'GrowthX Tech',
        period: '2021 – 2023',
        highlights: [
          'Tiến hành hơn 40 cuộc phỏng vấn người dùng chuyên sâu để xác định các điểm nghẽn trải nghiệm.',
          'Triển khai tính năng tự động nhắc nhở qua email, tăng tần suất quay lại hàng tuần thêm 18%.',
        ],
      },
    ],
    education: [
      {
        degree: 'Cử nhân Quản trị Kinh doanh Quốc tế',
        school: 'Đại học Ngoại Thương',
        period: '2017 – 2021',
        honors: 'Tốt nghiệp xuất sắc',
      },
    ],
    atsStrengths: [
      'Nhấn mạnh vào kết quả kinh doanh và chỉ số tăng trưởng (ARR, chuyển đổi)',
      'Thuật ngữ chuẩn hóa: Product Roadmap, A/B Testing, Cross-functional Leadership',
      'Phù hợp hoàn hảo với hệ thống sàng lọc vị trí quản lý và phát triển sản phẩm',
    ],
  },
];

export interface AiAssistantResponse {
  answer: string;
  tips: string[];
}

export const guestAssistantReplies: Record<string, AiAssistantResponse> = {
  ats: {
    answer:
      'Để CV vượt qua bộ lọc ATS (Applicant Tracking System), bạn nên chú ý 3 yếu tố quyết định:\n1. Định dạng rõ ràng: Dùng bố cục 1 cột tiêu chuẩn, phông chữ phổ biến (Inter, Roboto, Arial), tránh chèn biểu đồ phức tạp hoặc chữ chìm trong ảnh.\n2. Khớp từ khoá trọng tâm: Đưa các từ khoá xuất hiện trong Bản mô tả công việc (JD) vào phần Kỹ năng và Kinh nghiệm làm việc.\n3. Định lượng thành tựu: Sử dụng công thức "Đã đạt được X, đo lường bằng Y, thông qua hành động Z".',
    tips: [
      'Dùng các động từ hành động mạnh: "Thiết kế", "Tối ưu", "Dẫn dắt", "Tăng trưởng"',
      'Lưu định dạng PDF chuẩn văn bản (có thể quét/copy chữ được)',
      'Kiểm tra lại độ tương thích kỹ năng với công cụ AI của CareerPilot',
    ],
  },
  frontend: {
    answer:
      'Năm 2026, các nhà tuyển dụng Frontend tìm kiếm ứng viên có năng lực vững chắc về:\n1. Hệ sinh thái React hiện đại: Next.js (App Router, Server Components), TypeScript, Zustand/Redux.\n2. Hiệu năng & Khả năng tiếp cận: Tối ưu Core Web Vitals, SSR/SSG, Semantic HTML và chuẩn WCAG.\n3. Kỹ năng bổ trợ tương lai: Hiểu biết về tích hợp AI API (Streaming, Agentic UI), công cụ build hiện đại (Vite, Turbopack) và viết unit test với Vitest/Jest.',
    tips: [
      'Xây dựng 1-2 dự án thực tế có độ phức tạp cao thay vì nhiều dự án cơ bản',
      'Tập trung làm nổi bật khả năng xử lý bài toán hiệu năng tải trang',
      'Trình bày mã nguồn sạch sẽ trên GitHub kèm tài liệu README chi tiết',
    ],
  },
  weakness: {
    answer:
      'Khi trả lời câu hỏi "Điểm yếu lớn nhất của bạn là gì?", hãy áp dụng nguyên tắc "Thành thật + Đang cải thiện + Kết quả đo được":\n1. Chọn một kỹ năng phụ không làm suy yếu nhiệm vụ cốt lõi của vị trí ứng tuyển.\n2. Trình bày trung thực tình huống bạn nhận ra điểm yếu đó.\n3. Nêu rõ các bước cụ thể bạn đã và đang thực hiện để khắc phục.',
    tips: [
      'Ví dụ tốt: "Trước đây tôi có xu hướng quá cầu toàn dẫn đến kéo dài thời gian hoàn thành. Tôi đã học cách áp dụng quy tắc 80/20 và đặt ra các cột mốc kiểm tra tiến độ định kỳ."',
      'Tránh các câu trả lời sáo rỗng như: "Tôi quá chăm chỉ" hoặc "Tôi là người hoàn hảo"',
      'Nhấn mạnh tinh thần cầu tiến và khả năng tự phản tư của bản thân',
    ],
  },
  default: {
    answer:
      'Cảm ơn bạn đã đặt câu hỏi trong phiên dùng thử! Trong môi trường phát triển sự nghiệp hiện đại, việc liên tục cập nhật bộ kỹ năng số, xây dựng thương hiệu cá nhân trên LinkedIn và chuẩn bị một hồ sơ CV cá nhân hoá theo từng vị trí tuyển dụng là chìa khoá giúp bạn nổi bật.',
    tips: [
      'Hãy thử tạo nhanh một bản CV với AI Resume Builder ở tab bên cạnh',
      'Đăng ký tài khoản miễn phí để nhận tư vấn chuyên sâu 1-1 không giới hạn',
      'Xem danh sách việc làm phù hợp và độ tương thích được AI tính toán riêng',
    ],
  },
};
