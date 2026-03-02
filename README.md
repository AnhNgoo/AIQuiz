# 🎓 AI Quiz Chat-bot

Ứng dụng Web Chat-bot Quiz thông minh - Học tập hiệu quả với AI

## ✨ Tính năng

- ✍️ **Nhập thủ công câu hỏi**: Tự nhập câu hỏi và đáp án, đảm bảo 100% chính xác
- 🔀 **Trộn câu hỏi**: Đảo ngẫu nhiên thứ tự câu hỏi
- ✨ **AI tạo câu hỏi** (Tùy chọn): Rephrase câu hỏi tự nhiên hơn
- 💬 **Chat tương tác**: Giao diện chat hiện đại như ChatGPT
- 🧠 **Chế độ đào sâu (Probing)**: AI sẽ hỏi vặn nếu trả lời quá hời hợt
- 🔍 **Test API** (Nếu dùng AI): Kiểm tra kết nối API trước khi bắt đầu
- �📊 **Báo cáo chi tiết**: Xem điểm số và phân tích từng câu

## 🚀 Cách sử dụng

### 1. Chuẩn bị API Keys (TÙY CHỌN)

**⚠️ LƯU Ý QUAN TRỌNG**: API Key **CHỈ CẦN THIẾT** nếu bạn muốn bật tính năng **"✨ AI tạo câu hỏi"** (rephrase câu hỏi).

Nếu bạn chỉ muốn làm quiz đơn giản với câu hỏi gốc (không rephrase), **KHÔNG CẦN API Key**.

---

Nếu muốn dùng AI, bạn chỉ cần **ít nhất 1 trong 3** API Key:

- **Groq API** (Khuyến nghị - Nhanh nhất): [https://console.groq.com/](https://console.groq.com/)
  - Model: `llama-3.3-70b-versatile`
  - ⚡ Tốc độ xử lý cực nhanh
  - ⚠️ Có giới hạn rate limit (nếu vượt quá, hệ thống tự động chuyển sang Gemini)

- **Gemini API** (Khuyến nghị - Ổn định nhất): [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
  - Model: `gemini-2.5-flash`
  - ⭐ Không giới hạn rate limit nghiêm ngặt
  - ✅ Suy luận tốt, xử lý văn bản tiếng Việt xuất sắc

- **HuggingFace API** (Dự phòng): [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
  - Model: `deepseek-ai/DeepSeek-V3.2:novita`
  - 🔄 Là lớp dự phòng cuối cùng

**🎯 Hệ thống Fallback 3 tầng tự động:**

1. Nếu có Groq API → Thử Groq trước (nhanh nhất)
2. Nếu Groq thất bại/rate limit → Tự động chuyển sang Gemini
3. Nếu Gemini cũng thất bại → Tự động chuyển sang HuggingFace
4. Nếu cả 3 đều thất bại → Hiển thị lỗi chi tiết

**💡 Tip:** Sau khi nhập API Keys, bạn có thể click nút **"Test"** bên cạnh mỗi ô input để kiểm tra xem API đã hoạt động chưa!


### 2. Mở ứng dụng

1. Mở file `index.html` bằng trình duyệt web
2. (Tùy chọn) Click nút **⚙️** ở góc phải để mở Settings
3. (Tùy chọn) Nhập API Keys vào các ô tương ứng nếu muốn dùng AI
4. (Tùy chọn) Click nút **"Test"** bên cạnh mỗi API để kiểm tra kết nối
5. (Tùy chọn) Hoặc click **"🔍 Kiểm tra tất cả API"** để test toàn bộ
6. API Keys sẽ được lưu tự động vào trình duyệt

### 3. Cấu hình Quiz

Chọn các tùy chọn phù hợp:

- **🔀 Trộn câu hỏi**: Bật nếu muốn câu hỏi xuất hiện ngẫu nhiên
- **✨ AI tạo câu hỏi**: Bật nếu muốn AI viết lại câu hỏi tự nhiên hơn (Cần API Key)

### 4. Kiểm tra API (Nếu muốn dùng AI)

Trước khi bắt đầu quiz, nên test API để đảm bảo:

1. Nhập API Key vào ô tương ứng (Groq, Gemini, HuggingFace)
2. Click nút **"Test"** bên cạnh mỗi ô input
3. Đợi vài giây để hệ thống kiểm tra
4. Kết quả hiển thị:
   - ✅ **Thành công!** → Bạn sẽ thấy câu trả lời thực tế của AI bằng tiếng Việt
     - Ví dụ: `✅ Thành công! AI phản hồi: "Chào bạn, tôi đang hoạt động bình thường!"`
   - ❌ **Lỗi** → Kiểm tra lại API key hoặc quota
     - Ví dụ: `❌ Groq API Error: Rate limit exceeded`

**🎯 Ưu điểm của tính năng Test nâng cao:**

- Kiểm tra AI có phản hồi được tiếng Việt không
- Xem trực tiếp câu trả lời của AI (không chỉ hiện "OK" máy móc)
- Phát hiện lỗi cụ thể nếu API không hoạt động

**Shortcut:** Click nút **"🔍 Kiểm tra tất cả API"** để test toàn bộ cùng lúc!

### 5. Nhập câu hỏi thủ công

1. Nhập **câu hỏi** vào ô đầu tiên (tối thiểu 5 ký tự)
2. Nhập **đáp án** vào ô thứ hai (tối thiểu 3 ký tự)
3. Click nút **"➕ Thêm vào danh sách"**
4. Lặp lại cho tất cả câu hỏi bạn muốn học
5. Số lượng câu hỏi đã thêm sẽ hiển thị phía dưới

**💡 Mẹo:**

- Cả 2 ô nhập đều tự động giãn ra khi bạn nhập nhiều dòng
- Bấm nút **"🗑️ Xóa danh sách"** để xóa toàn bộ và nhập lại từ đầu
- Bạn có thể nhập đáp án dài (nhiều dòng, bullet points, v.v.)

**📝 Ví dụ nhập:**

```text
Câu hỏi: Kiểm thử phần mềm là gì?

Đáp án: Kiểm thử phần mềm là quá trình đánh giá và xác minh 
rằng sản phẩm phần mềm thực hiện chức năng như mong đợi, 
không có lỗi, và đáp ứng yêu cầu đã đặt ra.
```

### 6. Bắt đầu Quiz

1. Click nút **"🚀 Bắt đầu Quiz"** sau khi đã thêm ít nhất 1 câu hỏi
2. Nếu bật tính năng "AI tạo câu hỏi", hệ thống sẽ rephrase câu hỏi (Tự động chọn API tốt nhất)
3. Trả lời các câu hỏi trong giao diện chat

**💡 Mẹo:** Nếu bật AI rephrase, mở Console (F12) để xem chi tiết API nào đang được sử dụng:

```text
🔄 Đang thử rephrase bằng Groq API...
⚠️ Groq thất bại: Rate limit exceeded
🔄 Đang thử rephrase bằng Gemini API...
✅ Gemini xử lý thành công!
```

### 7. Xem kết quả

Sau khi hoàn thành, bạn sẽ thấy:

- Điểm số tổng thể (%)
- Chi tiết từng câu: câu hỏi, câu trả lời của bạn, đáp án chuẩn
- Số lần AI hỏi vặn (nếu có)
- Lời khuyên học tập

## 🎯 Chế độ Probing (Đào sâu)

Đây là tính năng độc đáo của ứng dụng:

- Nếu bạn trả lời đúng nhưng **quá ngắn gọn** (chỉ keyword)
- AI sẽ **KHÔNG CHO QUA** mà hỏi vặn thêm
- Bạn phải giải thích chi tiết hơn mới được qua câu

**Ví dụ:**

```text
🤖 AI: Các nguyên tắc kiểm thử phần mềm?
👤 User: Kiểm thử sớm
🤖 AI: 🤔 Đúng là có nguyên tắc kiểm thử sớm, 
       nhưng em có thể giải thích chi tiết 
       nguyên tắc này và các nguyên tắc khác không?
```

## 🛠️ Công nghệ sử dụng

- **HTML5**: Cấu trúc
- **CSS3**: Styling với design hiện đại
- **Vanilla JavaScript**: Logic xử lý
- **Groq API** (Tùy chọn): Rephrase câu hỏi và đánh giá nhanh
- **Gemini API** (Tùy chọn): Rephrase câu hỏi và chat thông minh
- **HuggingFace API** (Tùy chọn): Fallback

## 📱 Responsive Design

Ứng dụng hoạt động tốt trên:
- 💻 Desktop
- 📱 Tablet
- 📱 Mobile

## 🔒 Bảo mật

- API Keys được lưu trong localStorage của trình duyệt
- Không gửi dữ liệu đến server bên thứ 3 (ngoài API AI)
- Tài liệu được xử lý hoàn toàn trên client

## 🐛 Xử lý lỗi

Nếu gặp lỗi:

1. **"Vui lòng thêm ít nhất 1 câu hỏi"**: Bạn chưa nhập câu hỏi nào, hãy thêm câu hỏi trước
2. **"API Key required"**: Bạn bật tính năng AI rephrase nhưng chưa nhập API key
3. **API Error**: Kiểm tra API key còn hạn và có quota
4. **Lỗi rephrase**: Hệ thống sẽ tự động dùng câu hỏi gốc nếu AI rephrase thất bại

## 💡 Tips

1. **Nhập câu hỏi rõ ràng** → Dễ học và ghi nhớ hơn
2. **Nhập đáp án chi tiết** → AI đánh giá chính xác hơn
3. **Bật AI tạo câu hỏi** → Câu hỏi tự nhiên hơn (Cần API Key)
4. **Trả lời chi tiết** → Tránh bị AI hỏi vặn
5. **Làm lại nhiều lần** → Ghi nhớ kiến thức tốt hơn
6. **Xóa và nhập lại** → Dùng nút "🗑️ Xóa danh sách" nếu muốn thay đổi hoàn toàn

## 📞 Hỗ trợ

Nếu cần hỗ trợ, vui lòng:
- Kiểm tra console log (F12)
- Đảm bảo có kết nối internet
- Kiểm tra API keys hợp lệ

---

**Chúc bạn học tập hiệu quả! 🎉**
