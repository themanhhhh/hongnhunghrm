# Tổng hợp tính năng BRAVO HRM

## Tổng quan

Đây là hệ thống BRAVO HRM dạng web, gồm:

- Frontend: React + Vite.
- Backend: Node.js + Express.
- Cơ sở dữ liệu: SQLite.
- Xác thực: JWT + bcrypt.
- Có dữ liệu mẫu fallback khi API GET không kết nối.
- Build frontend hiện tại chạy thành công; có cảnh báo bundle JavaScript lớn khoảng 688 KB.

## 1. Đăng nhập và phân quyền

- Đăng nhập bằng username/password.
- Đăng xuất.
- Lưu phiên đăng nhập bằng `localStorage`.
- Token JWT có thời hạn 24 giờ.
- Hiển thị/ẩn mật khẩu.
- Giao diện “Ghi nhớ đăng nhập”.
- Giao diện quên mật khẩu.
- Phân quyền theo các vai trò:
  - Administrator.
  - HR Staff.
  - Ban Giám đốc.
  - Trưởng Khối.
  - Trưởng Phòng.
  - Nhân viên.
- Nhân viên thường chỉ được xem hồ sơ cá nhân và tạo đơn nghỉ phép.
- Administrator được truy cập toàn bộ hệ thống.
- Có chuyển đổi vai trò phục vụ demo, chỉ Administrator được sử dụng.

## 2. Dashboard

### Administrator

- Tổng số tài khoản.
- Tài khoản đang hoạt động.
- Tài khoản bị khóa.
- Tổng số phòng ban.
- Tổng số nhân sự.
- Tổng số vị trí.
- Cơ cấu tài khoản theo vai trò.
- Phân bổ nhân sự theo phòng ban.
- Danh sách tài khoản mới trong 30 ngày.
- Danh sách tài khoản bị khóa.
- Các nút thao tác nhanh:
  - Tạo tài khoản.
  - Quản lý tài khoản.
  - Phân quyền.
  - Quản lý bộ phận.
  - Quản lý vị trí.
  - Quản lý loại hợp đồng.

### HR Staff

- Tổng số yêu cầu tuyển dụng.
- Yêu cầu đang chờ duyệt.
- Yêu cầu đang tuyển.
- Tổng số ứng viên.
- Ứng viên đang xử lý.
- Lịch phỏng vấn sắp tới.
- Offer đang chờ xử lý.
- Pipeline tuyển dụng 10 giai đoạn.
- Thống kê tuyển dụng theo vị trí.
- Công việc cần HR xử lý:
  - Yêu cầu tuyển dụng.
  - Offer.
  - Hợp đồng sắp hết hạn.
  - Đề xuất nhân sự.
  - Đơn nghỉ phép.
- Cơ cấu nhân sự theo phòng ban.
- Cơ cấu nhân sự theo chức danh.

### Ban Giám đốc

- Tổng số nhân sự.
- Nhân sự mới trong kỳ.
- Nhân sự nghỉ việc.
- Vị trí đang tuyển.
- Phiếu chờ Ban Giám đốc duyệt.
- Tổng quan nhu cầu tuyển dụng.
- Số lượng đã tuyển.
- Số lượng còn thiếu.
- Tỷ lệ hoàn thành kế hoạch.
- Cơ cấu nhân sự theo phòng ban.
- Biến động nhân sự theo tháng/quý/năm.
- Danh sách phiếu:
  - Thuyên chuyển/bổ nhiệm.
  - Nghỉ việc.
  - Khen thưởng/kỷ luật.
  - Tuyển dụng.
  - Nghỉ phép cấp quản lý.

### Trưởng Phòng/Trưởng Khối

- Định biên nhân sự của đơn vị.
- Chứng từ chờ phê duyệt.
- Lịch phỏng vấn chuyên môn.
- Đánh giá KPI và thử việc.
- Duyệt/từ chối yêu cầu tuyển dụng.
- Xem lịch phỏng vấn và các thông tin đơn vị.

## 3. Quản trị hệ thống

Chỉ Administrator được truy cập.

### Tài khoản và phân quyền

- Xem danh sách tài khoản.
- Tìm kiếm tài khoản.
- Tạo tài khoản mới.
- Sửa họ tên, email, số điện thoại.
- Gán vai trò.
- Gán phòng ban.
- Khóa/mở khóa tài khoản.
- Xóa tài khoản.
- Không cho phép xóa tài khoản đang đăng nhập.
- Tài khoản Nguyễn Hồng Nhung có quyền xóa tài khoản đặc biệt.

### Danh mục bộ phận

- Thêm, sửa, xóa bộ phận.
- Khai báo mã và tên bộ phận.
- Khai báo bộ phận cấp trên.
- Gán trưởng bộ phận.
- Khai báo chỉ tiêu định biên.
- Mô tả chức năng nhiệm vụ.
- Tra cứu nhân sự thuộc từng bộ phận.
- Không cho xóa bộ phận đang có nhân sự hoặc bộ phận con.

### Danh mục vị trí công việc

- Thêm, sửa, xóa vị trí.
- Gán vị trí vào bộ phận.
- Khai báo thang/bậc lương.
- Khai báo chỉ tiêu nhân sự.
- Đánh dấu vị trí trợ lý/thư ký.
- Xem nhân sự đang sử dụng vị trí.
- Không cho xóa vị trí đang được nhân sự sử dụng.

### Danh mục loại hợp đồng

- Thêm, sửa, xóa loại HĐLĐ.
- Khai báo thời hạn hợp đồng.
- Khai báo có/không có thử việc.
- Khai báo số ngày thử việc.
- Kiểm tra loại hợp đồng đang được sử dụng trước khi xóa.

### Lộ trình hợp đồng theo vị trí

- Khai báo các bước ký hợp đồng theo từng vị trí.
- Chọn loại hợp đồng cho từng bước.
- Sắp xếp thứ tự bước.
- Thêm ghi chú.
- Xóa bước lộ trình.

## 4. Quản lý tuyển dụng

### Định biên nhân sự

- Tạo phiếu định biên.
- Tự sinh số phiếu.
- Gán bộ phận.
- Khai báo tổng định biên.
- Khai báo sức chứa tối đa.
- Theo dõi số nhân sự hiện tại.
- Chi tiết định biên theo vị trí.
- Theo dõi định biên, nghỉ việc, thai sản, hiện tại và cần tuyển.
- Khai báo ngân sách tuyển dụng.
- Phân rã chi phí theo nguồn tuyển dụng.
- Trạng thái: Tạo phiếu, Đang duyệt, Đã hoàn thiện, Từ chối.
- Có audit log khi tạo, sửa, xóa và đổi trạng thái.

### Yêu cầu tuyển dụng

- Tạo yêu cầu tuyển dụng.
- Sửa yêu cầu.
- Xóa yêu cầu.
- Chọn người lập.
- Chọn bộ phận và vị trí.
- Khai báo số lượng cần tuyển.
- Khai báo ngày cần người.
- Khai báo lý do.
- Chọn mức ưu tiên.
- Phân biệt trong định biên và ngoài định biên.
- Duyệt hoặc từ chối yêu cầu.

### Hồ sơ ứng viên

- Tiếp nhận hồ sơ ứng viên.
- Sửa hồ sơ.
- Xóa ứng viên chưa được tuyển.
- Tìm kiếm và nhóm theo vị trí/yêu cầu tuyển dụng.
- Quản lý mã ứng viên, họ tên, ngày sinh, giới tính, CCCD, điện thoại, email và địa chỉ.
- Quản lý trình độ, trường đào tạo, ngành đào tạo và kinh nghiệm.
- Quản lý nguồn tuyển dụng và người giới thiệu.
- Quản lý trạng thái ứng viên.
- Có tab thông tin tuyển dụng.
- Có tab tài liệu đính kèm.

### Sơ loại ứng viên

- Tạo phiếu sơ loại.
- Sửa phiếu.
- Xóa phiếu.
- Chấm mức độ phù hợp.
- Đánh giá đạt/không đạt.
- Khai báo tiêu chí sơ loại chi tiết.
- Ghi chú đánh giá.
- Xem thông tin đào tạo và vị trí ứng tuyển.

### Lịch phỏng vấn và thi tuyển

- Tạo lịch phỏng vấn/thi tuyển.
- Sửa lịch.
- Xóa lịch.
- Chọn hình thức online/offline.
- Khai báo địa điểm hoặc link họp.
- Khai báo thời gian bắt đầu/kết thúc.
- Chọn nhiều ứng viên.
- Chọn hội đồng tuyển dụng.
- Đánh dấu người quyết định.
- Khai báo bài thi, thời lượng và điểm kỳ vọng.
- Quản lý thông tin đề thi và đáp án.

### Đánh giá phỏng vấn

- Tạo phiếu đánh giá phỏng vấn.
- Sửa phiếu.
- Xóa phiếu.
- Khai báo thời lượng.
- Chấm điểm.
- Đánh giá đạt/không đạt.
- Nhập nhận xét chung.
- Có kịch bản phỏng vấn gồm câu hỏi, kỳ vọng và câu trả lời.
- Có tiêu chí đánh giá chi tiết.
- Chỉ thành viên hội đồng phỏng vấn hoặc HR/Admin được đánh giá.

### Offer

- Tạo thư mời nhận việc.
- Sửa Offer.
- Xóa Offer.
- Khai báo ngày Offer.
- Khai báo ngày dự kiến đi làm.
- Khai báo lương thử việc.
- Khai báo lương chính thức.
- Khai báo ghi chú và trạng thái Offer.
- Khi tạo Offer, ứng viên được chuyển sang trạng thái trúng tuyển.

### Chuyển ứng viên thành nhân viên

- Chọn ứng viên đạt/trúng tuyển.
- Tự động tạo hồ sơ nhân viên.
- Tự động sinh mã nhân viên.
- Tự động tạo hợp đồng thử việc.
- Lấy ngày bắt đầu và mức lương từ Offer.
- Chuyển trạng thái ứng viên thành `HIRED`.

## 5. Quản lý nhân sự

### Hồ sơ nhân sự

- Danh sách nhân sự.
- Tìm kiếm nhân viên.
- Lọc theo phòng ban, cấp bậc và trạng thái làm việc.
- Tạo hồ sơ nhân sự.
- Sửa hồ sơ.
- Xóa hồ sơ theo dạng nghỉ việc.
- Tính thâm niên.
- Quản lý thông tin cá nhân: họ tên, tên viết tắt, giới tính, ngày sinh, nơi sinh, nguyên quán, quốc tịch, dân tộc, tôn giáo, tình trạng hôn nhân và CCCD.
- Quản lý ngày vào làm, ngày chính thức, phòng ban, vị trí, chức vụ, quản lý trực tiếp và trạng thái làm việc.
- Quản lý số điện thoại, email cá nhân, email công ty, địa chỉ hiện tại, địa chỉ thường trú và ngày nghỉ việc.
- Các tab trong hồ sơ:
  - Thông tin cơ bản.
  - Thông tin tiếp nhận.
  - Thông tin liên hệ.
  - Hợp đồng lao động.
  - Quá trình công tác.
  - Khen thưởng/kỷ luật.

### Hợp đồng lao động

- Tạo hợp đồng.
- Sửa hợp đồng.
- Xóa hợp đồng.
- Khai báo người ký.
- Chọn nhân viên.
- Chọn loại hợp đồng.
- Khai báo thời hạn.
- Khai báo giai đoạn thử việc.
- Khai báo mô tả công việc.
- Khai báo thang/bậc lương.
- Khai báo lương cơ sở.
- Khai báo lương đóng BHXH.
- Khai báo phụ cấp.
- Theo dõi hợp đồng sắp hết hạn trong 30 ngày.

### Đề xuất thuyên chuyển/bổ nhiệm/miễn nhiệm

- Tạo phiếu đề xuất.
- Sửa phiếu.
- Xóa phiếu.
- Chọn nhiều nhân sự.
- Khai báo loại quyết định.
- Khai báo bộ phận/vị trí mới.
- Khai báo ngày hiệu lực.
- Ghi chú và lý do.
- Theo dõi trạng thái chờ duyệt.

### Quyết định thuyên chuyển/bổ nhiệm

- Ban hành quyết định.
- Tự sinh số quyết định.
- Chọn nhân viên.
- Chọn bộ phận/vị trí mới.
- Khai báo ngày hiệu lực.
- Chọn người ký.
- Tự động cập nhật phòng ban và vị trí mới cho nhân viên.
- Đánh dấu quyết định đã thi hành.

### Đơn xin nghỉ phép

- Tạo đơn nghỉ phép.
- Xem chi tiết.
- Xóa đơn.
- Chọn nhân viên.
- Khai báo thời gian nghỉ.
- Tính số ngày nghỉ.
- Khai báo lý do.
- Khai báo người liên quan.
- Ghi chú người duyệt.
- Theo dõi trạng thái.
- Có lịch sử phê duyệt nhiều cấp.

Luồng duyệt hiện có:

- Nhân viên → Trưởng phòng → Ban Giám đốc.
- Trưởng phòng thuộc khối → Trưởng khối → Ban Giám đốc.
- Trưởng phòng độc lập → Ban Giám đốc.
- Trưởng khối → Ban Giám đốc.
- Ban Giám đốc/Administrator tự gửi thì tự động duyệt.

## 6. Khen thưởng và kỷ luật

### Tiêu chí đánh giá

- Tạo tiêu chí đánh giá.
- Khai báo mã, tên, trọng số và mô tả.
- Khai báo thang điểm chi tiết.
- Xóa tiêu chí chưa được sử dụng.

### Phiếu đánh giá nhân viên

- Tạo phiếu đánh giá.
- Chọn người đánh giá.
- Chọn nhân viên được đánh giá.
- Chọn năm đánh giá.
- Chọn nhiều tiêu chí.
- Nhập trọng số, điểm từ 0 đến 10 và ghi chú.
- Tự tính điểm tổng hợp.
- Tự xếp loại A+, A, B, C hoặc D.
- Xem chi tiết phiếu đánh giá.
- Xóa phiếu.

### Đề xuất khen thưởng/kỷ luật

- Tạo đề xuất khen thưởng.
- Tạo đề xuất kỷ luật.
- Chọn nhân viên.
- Khai báo số tiền.
- Nhập lý do.
- Theo dõi trạng thái chờ ban hành quyết định.
- Xóa đề xuất.

### Quyết định khen thưởng/kỷ luật

- Ban hành quyết định khen thưởng.
- Ban hành quyết định kỷ luật.
- Chọn nhân viên.
- Nhập nội dung.
- Chọn người ký.
- Tự sinh số quyết định.
- Xóa quyết định.

### Tra cứu lịch sử

- Lọc theo nhân viên.
- Xem lịch sử đánh giá.
- Xem lịch sử khen thưởng/kỷ luật.
- Xem điểm, xếp loại, lý do và số quyết định.

## 7. Báo cáo và phân tích

Website khai báo 18 loại báo cáo:

- Báo cáo kết quả tuyển dụng.
- Hiệu quả tuyển dụng theo nguồn.
- Chất lượng nguồn tuyển dụng.
- Danh sách ứng viên phỏng vấn/thi tuyển.
- Danh sách ứng viên nhận Offer.
- Danh sách ứng viên đã đi làm.
- Báo cáo biến động nhân sự.
- Báo cáo tổng hợp nhân sự.
- Danh sách nhân viên theo hợp đồng.
- Báo cáo thâm niên.
- Danh sách sinh nhật nhân viên.
- Danh sách chấm dứt hợp đồng.
- Danh sách nhân viên nghỉ việc.
- Báo cáo nhân sự theo thời điểm.
- Đánh giá chi tiết nhân viên.
- Tổng hợp đánh giá nhân viên.
- Tổng hợp xếp loại nhân viên.
- Báo cáo đề xuất thưởng phạt.

Chức năng báo cáo:

- Cây danh mục báo cáo.
- Mở/đóng nhóm báo cáo.
- Xem trước mẫu báo cáo A4.
- Lọc theo ngày.
- Lọc theo phòng ban.
- Lọc theo kỳ thống kê.
- Chạy báo cáo.
- In hoặc lưu PDF thông qua trình duyệt.
- Xuất Excel `.xls`.
- Xuất CSV.

## 8. Thành phần dùng chung

- Bảng dữ liệu có tìm kiếm.
- Phân trang, mỗi trang 12 bản ghi.
- Double-click để mở chi tiết.
- Modal nhập liệu.
- Toast thông báo thành công/thất bại.
- Badge trạng thái.
- Xác nhận trước khi xóa.
- Error Boundary khi giao diện xảy ra lỗi.
- Giao diện đăng nhập responsive trên mobile.

## 9. Những phần chưa hoàn thiện hoặc chưa được đưa ra menu

Các phần backend hoặc hàm xử lý đã tồn tại nhưng hiện chưa được hiển thị đầy đủ trong menu:

- Kế hoạch tuyển dụng.
- Đề xuất hợp đồng lao động.
- Gia hạn hợp đồng lao động.
- Đơn xin nghỉ việc.
- Quyết định nghỉ việc.
- Quản lý quá trình công tác độc lập.
- Upload ảnh đại diện nhân viên.
- Audit log chưa có màn hình quản trị để xem trực tiếp.

Các tính năng chưa thấy trong hệ thống:

- Chấm công.
- Tính lương/payroll.
- Bảo hiểm.
- Đào tạo.
- Phúc lợi.
- Quản lý ngày phép theo hạn mức.
- Thông báo email thực tế.
- Đổi mật khẩu.
- Quản lý hồ sơ file vật lý hoàn chỉnh.

## 10. Một số lưu ý kỹ thuật

- Quên mật khẩu hiện chỉ là giao diện mô phỏng, chưa có API gửi email.
- Checkbox “Ghi nhớ đăng nhập” hiện chưa thay đổi cách lưu phiên.
- File ứng viên mới chỉ lưu tên file trong dữ liệu, chưa upload file thật lên server.
- Một số báo cáo đang dùng dữ liệu mẫu hoặc truy vấn theo cấu trúc cũ, nên độ chính xác cần kiểm tra thêm với dữ liệu SQLite thực tế.
- Thao tác duyệt trực tiếp trên Dashboard Ban Giám đốc hiện chủ yếu cập nhật giao diện cục bộ, chưa lưu đầy đủ qua API.
- Dashboard Trưởng phòng/Trưởng khối vẫn còn một phần dữ liệu mẫu.
- Backend có API phân quyền tương đối đầy đủ, nhưng một số quyền trên frontend và backend chưa hoàn toàn đồng nhất.

## Kết luận

Sản phẩm hiện đã bao phủ các luồng quản trị nhân sự, tuyển dụng, hồ sơ nhân viên, hợp đồng, nghỉ phép, điều chuyển, đánh giá, khen thưởng/kỷ luật và báo cáo.

Tuy nhiên, hệ thống hiện vẫn ở mức prototype/demo có dữ liệu mẫu, chưa phải hệ thống HRM production hoàn chỉnh.
