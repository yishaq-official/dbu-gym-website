```
server/
├── composer.json
├── composer.lock
├── .env
├── .env.example
├── README.md
├── public/
│   ├── index.php
│   └── .htaccess
├── bootstrap/
│   ├── app.php
├── config/
│   ├── app.php
│   ├── database.php
│   ├── auth.php
│   ├── services.php
│   └── chapa.php
├── src/
│   ├── Router.php
│   ├── Database.php
│   ├── routes/
│   │   ├── api.php
│   │   ├── admin.php
│   │   ├── member.php
│   ├── Core/
│   │   ├── Application.php
│   ├── Contracts/
│   │   ├──Services/
│   │   ├──Repositories/
│   ├── Controllers/
│   │   ├── AuthController.php
│   │   ├── PaymentController.php
│   │   ├── Admin/
│   │   │   ├── DashboardController.php
│   │   │   ├── MemberController.php
│   │   │   ├── ApprovalController.php
│   │   │   ├── SettingsController.php
│   │   │   └── ProfileController.php
│   │   ├── Member/
│   │   │   ├── ProfileController.php
│   │   │   ├── DashboardController.php
│   │   │   └── MembershipController.php
│   ├── Models/
│   │   ├── User.php
│   │   ├── MemberProfile.php
│   │   ├── MembershipPlan.php
│   │   ├── Payment.php
│   │   ├── Approval.php
│   │   ├── SystemSetting.php
│   │   └── AuditLog.php
│   ├── Services/
│   │   ├── AuthService.php
│   │   ├── UserService.php
│   │   ├── PaymentService.php
│   │   ├── MemberService.php
│   │   ├── AdminService.php
│   │   ├── SettingsService.php
│   │   ├── FileService.php
│   │   └── CsvService.php
│   ├── Middleware/
│   │   ├── AuthMiddleware.php
│   │   ├── RoleMiddleware.php
│   │   ├── JsonMiddleware.php
│   │   └── ValidationMiddleware.php
│   ├── Validators/
│   │   ├── AuthValidator.php
│   │   ├── PaymentValidator.php
│   │   ├── AdminValidator.php
│   │   └── MemberValidator.php
│   ├── Helpers/
│   │   ├── Response.php
│   │   ├── JwtHelper.php
│   │   ├── UploadHelper.php
│   │   └── DateHelper.php
├── storage/
│   ├── uploads/
│   │   ├── avatars/
│   │   └── logos/
│   └── logs/
└── tests/
    ├── Controllers/
    ├── Services/
    ├── Models/
    └── Routes/
```