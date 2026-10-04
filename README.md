# Nghe Rừng Kể

Website truyền thông môi trường dạng Multi-Page App, được xây dựng bằng Vite,
Vanilla TypeScript và CSS thuần.

## Các trang

- `index.html`: Trang chủ.
- `about.html`: Sứ mệnh, tầm nhìn, mục tiêu và đội ngũ.
- `story.html`: Câu chuyện về rừng, Bù Gia Mập và timeline.
- `join.html`: Bản đồ trồng cây ảo và biểu mẫu tham gia.
- `team.html`: Nhóm thực hiện và thông tin liên hệ.
- `thank-you.html`: Tạo thiệp cảm ơn cá nhân hóa và tải ảnh PNG.

Nội dung tĩnh nằm trong từng file HTML. `main.ts` chỉ khởi tạo dark mode,
menu và animation; `counter.ts` xử lý riêng chức năng trồng cây.

## Chạy dự án

```bash
npm install
npm run dev
```

Build production:

```bash
npm run build
npm run preview
```

## Deploy lên GitHub Pages

Project đã có workflow tại `.github/workflows/deploy-pages.yml`.
Tạo repository công khai tên `nghe-rung-ke`, đẩy branch `main` lên GitHub,
sau đó vào **Settings → Pages**, chọn **GitHub Actions** ở phần **Build and deployment**.
Website sẽ có địa chỉ:

`https://<username>.github.io/nghe-rung-ke/`

## Chức năng

- Sáu trang HTML độc lập, mỗi trang có URL riêng.
- Navbar ba nhóm có dropdown: Nghe Rừng Kể, Về Dự Án, Về Chúng Tôi;
  nút Cùng Hành Động luôn dẫn đến trang trồng cây.
- Thư cảm ơn tự động nhận tên sau khi trồng cây, cho phép đổi tên, thêm ảnh,
  tải PNG hoặc chia sẻ bằng Web Share API. Trên điện thoại, chọn “Lưu hình ảnh”
  trong bảng chia sẻ để lưu ảnh vào thiết bị.
- Giao diện responsive theo concept “From Awareness to Action”.
- Dark/Light mode, menu mobile, animation theo thao tác cuộn.
- Bản đồ cây ảo tương tác, kiểm tra link minh chứng và lưu dữ liệu bằng `localStorage`.
- Timeline dự án, KPI, CTA và thông tin Bù Gia Mập.

> Trước khi xuất bản chính thức, hãy thay link TikTok/website/email và đối chiếu số liệu Bù Gia Mập với nguồn chính thức.
