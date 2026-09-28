# Solana Escrow Anchor Program

Dự án Solana Smart Contract (Program) cho ứng dụng **Escrow** (Ký quỹ trao đổi token SPL), được xây dựng bằng **Anchor Framework**.

---

## 📁 Cấu trúc thư mục

```text
program/
├── Anchor.toml                     # Cấu hình môi trường Anchor & Program ID
├── Cargo.toml                      # Workspace Cargo cho các Solana program
├── package.json                    # Dependencies TypeScript & Anchor client
├── tsconfig.json                   # Cấu hình TypeScript
├── programs/
│   └── escrow/                     # Thư mục mã nguồn Smart Contract
│       ├── Cargo.toml              # Dependencies Rust (anchor-lang, anchor-spl)
│       ├── Xargo.toml              # Cấu hình BPF
│       └── src/
│           ├── lib.rs              # Điểm vào chính của Program & Routing instructions
│           ├── state.rs            # Định nghĩa tài khoản Escrow PDA
│           ├── errors.rs           # Mã lỗi tùy chỉnh (Custom Errors)
│           └── instructions/       # Logic xử lý các hành động
│               ├── mod.rs
│               ├── make.rs         # Maker tạo giao dịch ký quỹ (khóa Token A vào Vault)
│               ├── take.rs         # Taker đồng ý đổi Token B lấy Token A
│               └── refund.rs       # Maker hủy bỏ và rút lại Token A từ Vault
└── tests/
    └── escrow.ts                   # Bộ kiểm thử End-to-End bằng TypeScript & Mocha
```

---

## 🛠️ Chuẩn bị môi trường (Prerequisites)

Do Solana toolchain (BPF compiler) hoạt động ổn định nhất trên Linux, trên Windows khuyến nghị thao tác thông qua **WSL2 (Ubuntu)**:

1. **Rust & Cargo**:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
2. **Solana CLI**:
   ```bash
   sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
   ```
3. **Anchor CLI (avm)**:
   ```bash
   cargo install --git https://github.com/coral-xyz/anchor avm --force
   avm install latest
   avm use latest
   ```

---

## 🚀 Các lệnh phát triển chính

Di chuyển vào thư mục `program`:

```bash
cd program
```

### 1. Cài đặt dependencies (TypeScript test)

```bash
npm install
# hoặc: pnpm install
```

### 2. Build Smart Contract

Lệnh này sẽ biên dịch mã nguồn Rust sang BPF bytecode và tạo file IDL (Interface Definition Language) trong `target/idl/escrow.json`:

```bash
anchor build
```

### 3. Chạy kiểm thử tự động

Anchor sẽ tự động khởi động Solana local validator, deploy program và chạy file test `tests/escrow.ts`:

```bash
anchor test
```

### 4. Kết nối với Frontend (`front-end/vite-project`)

Sau khi chạy `anchor build`, bạn có thể copy file:

- `program/target/idl/escrow.json`
- `program/target/types/escrow.ts`

vào thư mục `front-end/vite-project/src/idl/` để sử dụng `@coral-xyz/anchor` gọi các phương thức `make`, `take`, `refund` từ giao diện React.
