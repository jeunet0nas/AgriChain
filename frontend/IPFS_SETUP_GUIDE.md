# 🚀 Hướng dẫn Setup IPFS với Pinata

## Bước 1: Lấy Pinata JWT Token

1. Truy cập https://app.pinata.cloud/ và đăng nhập (hoặc đăng ký free account)
2. Vào **API Keys** (menu bên trái)
3. Click **New Key**
4. Cấu hình permissions:
   - ✅ `pinFileToIPFS`
   - ✅ `pinJSONToIPFS`
   - (Optional) `pinByHash`, `unpin`
5. Đặt tên key (VD: "AgriChain Development")
6. Click **Create Key**
7. **QUAN TRỌNG**: Copy **JWT Token** ngay (chỉ hiển thị 1 lần!)

## Bước 2: Cấu hình Frontend

### 2.1. Tạo file `.env` trong thư mục frontend

```bash
cd frontend
cp .env.example .env
```

### 2.2. Mở file `.env` và paste JWT token

```env
# Pinata Configuration
VITE_PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI...

# IPFS Gateway  
VITE_IPFS_GATEWAY=https://gateway.pinata.cloud
```

**Lưu ý**: 
- Token phải bắt đầu bằng `eyJ...`
- Không có dấu cách hoặc xuống dòng
- Không commit file `.env` vào git (đã có trong .gitignore)

### 2.3. Restart dev server

```bash
# Stop server (Ctrl+C)
npm run dev
```

## Bước 3: Kiểm tra kết nối

1. Mở ứng dụng: http://localhost:5173
2. Ở đầu trang sẽ thấy panel **"Pinata IPFS Status"**
3. Click **"Test Connection"**
4. Nếu thành công: ✅ màu xanh lá
5. Nếu thất bại: ❌ màu đỏ → kiểm tra lại JWT token

## Bước 4: Test tạo sản phẩm với IPFS

### 4.1. Với Farmer role:
1. Connect wallet với Farmer role
2. Vào tab **Farmer**
3. Điền form tạo lô mới:
   - Tên: "Test IPFS Upload"
   - Số lượng: 100
   - Vị trí: "Test Location"
4. Click **"Tạo lô on-chain"**
5. Xem console log:
   ```
   [FarmerCreateBatch] Uploading metadata to IPFS...
   [IPFS] Upload successful! CID: Qm...
   [IPFS] View at: https://gateway.pinata.cloud/ipfs/Qm...
   ```

### 4.2. Với Inspector role (trình duyệt khác):
1. Mở trình duyệt khác (Firefox, Edge, v.v.)
2. Connect wallet với Inspector role
3. **KHÔNG cần sync metadata** (IPFS tự động đồng bộ!)
4. Products sẽ hiển thị đúng tên "Test IPFS Upload" thay vì "Lô #X"

## So sánh localStorage vs IPFS

| Feature | localStorage | IPFS (Pinata) |
|---------|--------------|---------------|
| Chia sẻ giữa browsers | ❌ Không | ✅ Có |
| Chia sẻ giữa users | ❌ Không | ✅ Có |
| Permanent storage | ❌ Có thể bị xóa | ✅ Lưu vĩnh viễn (với pinning) |
| Setup | Không cần | Cần API key |
| Cost | Free | Free tier: 1GB storage |
| Production ready | ❌ Không | ✅ Có |

## Troubleshooting

### ❌ "Pinata authentication failed"
- Kiểm tra JWT token có đúng không
- Token có thể expire → tạo key mới
- Kiểm tra permissions: phải có `pinJSONToIPFS`

### ⚠️ "IPFS not configured, using localStorage"
- File `.env` chưa được tạo
- Biến `VITE_PINATA_JWT` chưa set
- Chưa restart dev server sau khi tạo `.env`

### 🐌 Upload chậm
- IPFS upload mất ~2-5s (bình thường)
- Nếu quá lâu: kiểm tra kết nối internet
- Có thể thêm loading indicator

### 🔗 Không fetch được metadata từ IPFS
- Đợi vài giây (IPFS cần thời gian propagate)
- Thử gateway khác: `https://ipfs.io/ipfs/CID`
- Check CORS nếu fetch thất bại

## View metadata trên Pinata

1. Vào https://app.pinata.cloud/
2. Tab **Files** → thấy list files đã upload
3. Click vào file → xem metadata JSON
4. Copy **IPFS URL** để share

## Pinata Free Tier Limits

- ✅ 1 GB storage
- ✅ Unlimited uploads
- ✅ Unlimited bandwidth
- ⚠️ 100 API calls/month cho unpinning

Đủ cho development và demo! Production cần upgrade plan.

## Migration từ localStorage sang IPFS

Nếu đã có products với localStorage URI:

1. **Không cần migrate** - app tự động fallback
2. Products mới sẽ dùng IPFS
3. Products cũ vẫn đọc được từ localStorage (trên cùng browser)
4. Inspector/Admin thấy products cũ là "Lô #X" (vì không có localStorage)
5. → Khuyên dùng: Tạo lại products sau khi config IPFS

## Next Steps (Optional)

### Custom IPFS Gateway
Thay `VITE_IPFS_GATEWAY` bằng gateway riêng:
```env
VITE_IPFS_GATEWAY=https://your-custom-gateway.com
```

### Upload files (images, documents)
Dùng `pinFileToIPFS` API trong `ipfsClient.js`

### Backup metadata
Pinata tự động backup, nhưng có thể export:
- Vào Pinata → Files → Export CSV
- Hoặc dùng Pinata SDK để bulk download

---

✅ **Setup xong!** Bây giờ metadata được lưu phân tán trên IPFS, mọi browser/user đều truy cập được!
