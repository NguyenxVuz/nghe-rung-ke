export interface SpeciesCard {
  number: string;
  name: string;
  group: string;
  image: string;
  status: string;
  description: string;
}

export const speciesGroups = [
  'NHÓM LINH TRƯỞNG & THÚ NHỎ (PRIMATES & MAMMALS)',
  'NHÓM CÁC LOÀI CHIM (BIRDS)',
  'NHÓM BÒ SÁT & SINH VẬT ĐẦM LẦY (REPTILES)',
] as const;

export const speciesCards: SpeciesCard[] = [
  {
    number: '01',
    name: 'Vượn đen má vàng',
    group: speciesGroups[0],
    image: '/assets/species-placeholder.svg',
    status: 'Nguy cấp (Sách Đỏ Việt Nam - Nhóm IB)',
    description: 'Con đực toàn thân màu đen tuyền với hai mảng má màu vàng sáng nổi bật; con cái khi trưởng thành chuyển sang màu vàng lông rơm/vàng mơ. Cánh tay rất dài, không có đuôi, tiếng hót ngân vang khắp thung lũng vào sáng sớm.',
  },
  {
    number: '02',
    name: 'Cu li nhỏ',
    group: speciesGroups[0],
    image: '/assets/species-placeholder.svg',
    status: 'Nguy cấp (Nhóm IB)',
    description: 'Kích thước nhỏ nhắn như quả bưởi, di chuyển chậm chạp. Điểm nhận diện không thể nhầm lẫn là đôi mắt tròn to màu nâu hạt dẻ giúp nhìn đêm, viền mắt sẫm và một vạch lông màu nâu chạy dọc sống lưng.',
  },
  {
    number: '03',
    name: 'Khỉ đuôi lợn',
    group: speciesGroups[0],
    image: '/assets/species-placeholder.svg',
    status: 'Sắp nguy cấp (Nhóm IIB)',
    description: 'Thân hình vạm vỡ, lông màu nâu ô-liu. Đặc điểm rõ nhất là chiếc đuôi ngắn ngủn, cong vút lên như đuôi lợn; đỉnh đầu có mảng lông màu nâu sẫm giống như đội một chiếc mũ tròn.',
  },
  {
    number: '04',
    name: 'Khỉ đuôi dài',
    group: speciesGroups[0],
    image: '/assets/species-placeholder.svg',
    status: 'Nhóm IIB',
    description: 'Chiếc đuôi rất dài (chiều dài đuôi thường bằng hoặc hơn chiều dài cơ thể), giúp giữ thăng bằng cực tốt khi leo trèo; mặt màu xám nâu, tính cách vô cùng nhanh nhẹn và lanh lợi.',
  },
  {
    number: '05',
    name: 'Tê tê Java',
    group: speciesGroups[0],
    image: '/assets/species-placeholder.svg',
    status: 'Cực kỳ nguy cấp (CR - Nhóm IB)',
    description: 'Toàn thân bao bọc bởi các lớp vảy sừng xếp lớp như mái ngói; mõm dài, lưỡi dính không răng chuyên dùng bắt kiến/mối. Khi gặp nguy hiểm sẽ cuộn tròn mình lại như một quả bóng giáp sắt.',
  },
  {
    number: '06',
    name: 'Mèo rừng',
    group: speciesGroups[0],
    image: '/assets/species-placeholder.svg',
    status: 'Nhóm IIB',
    description: 'Kích thước tương đương mèo nhà nhưng chân dài hơn; bộ lông màu vàng cam hoặc vàng xám với các đốm hoa mai đen bóng khắp thân; tai tròn, đuôi có các khoang đen rõ rệt.',
  },
  {
    number: '07',
    name: 'Rái cá vuốt bé',
    group: speciesGroups[0],
    image: '/assets/drive-images/species-otter.jpg',
    status: 'Nguy cấp (Nhóm IB)',
    description: 'Cơ thể thuôn dài hình thoi, bộ lông màu nâu sô-cô-la không thấm nước; màng bơi giữa các ngón phát triển, vuốt ngón ngắn nhỏ; tính cách tinh nghịch và gắn liền với môi trường nước.',
  },
  {
    number: '08',
    name: 'Khỉ mặt đỏ',
    group: speciesGroups[0],
    image: '/assets/drive-images/species-red-monkey.jpg',
    status: 'Nhóm IIB',
    description: 'Thân hình chắc khỏe, lông nâu sẫm, mặt ít lông màu đỏ hồng và đuôi rất ngắn; thường sống theo đàn.',
  },
  {
    number: '09',
    name: 'Niệc mỏ vằn',
    group: speciesGroups[1],
    image: '/assets/drive-images/species-niec.jpg',
    status: 'Nguy cấp (Nhóm IB)',
    description: 'Kích thước chim rất lớn; điểm đặc trưng nhất là chiếc mỏ sừng khổng lồ có các nếp gấp/rãnh vằn gồ ghề ở phần gốc; vùng da quanh cổ họng có màu sắc nổi bật (vàng hoặc xanh da trời tùy giới tính).',
  },
  {
    number: '10',
    name: 'Chim Rù Rì Nepal',
    group: speciesGroups[1],
    image: '/assets/species-placeholder.svg',
    status: 'Nhóm IIB',
    description: 'Thuộc họ Cú săn mồi cỡ lớn; đôi mắt màu vàng óng mở to sắc lẹm, đầu có hai chùm lông tai dựng đứng như sừng; tiếng kêu trầm bổng vang xa trong màn đêm rừng thẳm.',
  },
  {
    number: '11',
    name: 'Chim Công',
    group: speciesGroups[1],
    image: '/assets/species-placeholder.svg',
    status: 'Nguy cấp (Nhóm IB)',
    description: 'Bộ lông màu xanh lục ánh kim lấp lánh; hai vệt má màu vàng sáng; cá thể đực sở hữu chùm lông đuôi dài quét đất với hàng chục họa tiết "mắt ngọc" rực rỡ xòe rộng khi múa gọi bạn tình.',
  },
  {
    number: '13',
    name: 'Rùa núi vàng',
    group: speciesGroups[2],
    image: '/assets/species-placeholder.svg',
    status: 'Cực kỳ nguy cấp (CR - Nhóm IIB)',
    description: 'Mai dài gồ cao, có màu vàng nhạt hoặc vàng đất xen kẽ các đốm đen bất đối xứng; đầu màu vàng sáng (mùa sinh sản chuyển dần sang hồng quanh mắt và mũi); chân hình trụ chuyên đi bộ trên cạn.',
  },
  {
    number: '14',
    name: 'Rùa cạn',
    group: speciesGroups[2],
    image: '/assets/species-placeholder.svg',
    status: 'Tình trạng tùy loài, đang được cập nhật',
    description: 'Rùa cạn có mai gồ cao và chân thích nghi với việc đi lại trên mặt đất.',
  },
  {
    number: '18',
    name: 'Rùa nước ngọt',
    group: speciesGroups[2],
    image: '/assets/species-placeholder.svg',
    status: 'Tình trạng tùy loài, đang được cập nhật',
    description: 'Rùa nước ngọt có màng bơi giữa các ngón chân và thường sống gắn với môi trường nước.',
  },
  {
    number: '15',
    name: 'Cá sấu xiêm',
    group: speciesGroups[2],
    image: '/assets/drive-images/species-crocodile.jpg',
    status: 'Cực kỳ nguy cấp (CR - Nhóm IB)',
    description: 'Lớp da sần sùi màu xanh xám/ô-liu; mõm rộng phẳng, phía sau gáy có các tấm vảy gồ nổi cao; thường nằm bất động thả trôi mình mô phỏng khúc gỗ mục rình mồi.',
  },
  {
    number: '16',
    name: 'Trăn gấm & Trăn đất',
    group: speciesGroups[2],
    image: '/assets/species-placeholder.svg',
    status: 'Nhóm IIB',
    description: 'Cơ thể dài từ 2 đến 5 mét; da có hoa văn mắt lưới hình mắt cáo đen viền vàng kim óng ánh (trăn gấm) hoặc các đốm hoa mây màu nâu đất (trăn đất); chuyên leo trèo và săn mồi bằng cách quấn siết.',
  },
];
