# 📱 PromptFlow iOS - Claude Code 开发 TodoList

## 🤖 AI 开发说明
**目标**: 为 Claude Code AI 助手提供清晰的 iOS 开发任务列表  
**开发模式**: 逐步实现，每次完成1-3个相关任务  
**代码标准**: Swift 5.9+, SwiftUI, MVVM 架构  
**最低支持**: iOS 15.0+  

---

## 🏗️ 阶段 1: 项目基础架构

### 📁 项目结构和配置
- [ ] **T001**: 创建 Xcode 项目基础结构
  ```
  PromptFlowIOS/
  ├── App/
  │   ├── PromptFlowIOSApp.swift
  │   └── ContentView.swift
  ├── Core/
  │   ├── Network/
  │   ├── Storage/
  │   ├── Extensions/
  │   └── Utilities/
  ├── Features/
  │   ├── Authentication/
  │   ├── Prompts/
  │   ├── Teams/
  │   └── Settings/
  ├── Shared/
  │   ├── Components/
  │   ├── ViewModels/
  │   └── Models/
  └── Resources/
      ├── Assets.xcassets
      └── Localizable.strings
  ```

- [ ] **T002**: 配置 Info.plist 和项目设置
  ```xml
  <key>CFBundleIdentifier</key>
  <string>com.promptflow.ios</string>
  <key>NSAppTransportSecurity</key>
  <dict>
      <key>NSAllowsArbitraryLoads</key>
      <false/>
  </dict>
  <key>UILaunchStoryboardName</key>
  <string>LaunchScreen</string>
  ```

- [ ] **T003**: 创建 Package.swift 依赖配置
  ```swift
  // swift-tools-version: 5.9
  dependencies: [
      .package(url: "https://github.com/Alamofire/Alamofire.git", from: "5.8.0"),
      .package(url: "https://github.com/onevcat/Kingfisher.git", from: "7.9.0")
  ]
  ```

### 🎨 设计系统基础
- [ ] **T004**: 创建 Colors.swift 色彩系统
  ```swift
  struct AppColors {
      static let primary = Color(hex: "#007AFF")
      static let secondary = Color(hex: "#5856D6")
      static let accent = Color(hex: "#FF9500")
      static let success = Color(hex: "#34C759")
      static let warning = Color(hex: "#FF9500")
      static let error = Color(hex: "#FF3B30")
      
      static let background = Color(.systemBackground)
      static let secondaryBackground = Color(.secondarySystemBackground)
      static let groupedBackground = Color(.systemGroupedBackground)
  }
  ```

- [ ] **T005**: 创建 Typography.swift 字体系统
  ```swift
  struct AppTypography {
      static let largeTitle = Font.largeTitle.weight(.bold)
      static let title1 = Font.title.weight(.semibold)
      static let title2 = Font.title2.weight(.semibold)
      static let headline = Font.headline.weight(.medium)
      static let body = Font.body
      static let caption = Font.caption
      static let footnote = Font.footnote
      
      static let codeFont = Font.system(.body, design: .monospaced)
  }
  ```

- [ ] **T006**: 创建 Spacing.swift 布局规范
  ```swift
  struct AppSpacing {
      static let xs: CGFloat = 4
      static let sm: CGFloat = 8
      static let md: CGFloat = 16
      static let lg: CGFloat = 24
      static let xl: CGFloat = 32
      static let xxl: CGFloat = 48
      
      static let cornerRadius: CGFloat = 12
      static let buttonHeight: CGFloat = 50
      static let cardPadding: CGFloat = 16
  }
  ```

### 🌐 网络层架构
- [ ] **T007**: 创建 APIEndpoint.swift 端点定义
  ```swift
  enum APIEndpoint {
      // 认证
      case login(email: String, password: String)
      case register(username: String, email: String, password: String)
      case refreshToken
      
      // 提示词
      case getPrompts(category: String?, isTemplate: Bool?)
      case getMyPrompts(category: String?, isTemplate: Bool?)
      case createPrompt(PromptRequest)
      case updatePrompt(id: Int, PromptRequest)
      case deletePrompt(id: Int)
      case getPromptDetail(id: Int)
      
      // 版本控制
      case getVersions(promptId: Int)
      case createVersion(promptId: Int, VersionRequest)
      case revertVersion(promptId: Int, version: Int)
      
      // AI 功能
      case analyzePrompt(content: String)
      case optimizePrompt(OptimizeRequest)
      case findSimilar(content: String)
      case categorize(content: String)
      case getInsights
      
      // 团队
      case getTeams
      case createTeam(TeamRequest)
      case getTeamDetail(id: Int)
      case inviteMember(teamId: Int, MemberRequest)
      case updateMemberRole(teamId: Int, memberId: Int, role: String)
      
      // 评论
      case getComments(promptId: Int)
      case createComment(CommentRequest)
      case updateComment(id: Int, content: String)
      case deleteComment(id: Int)
      
      var baseURL: String { "http://localhost:3001/api" }
      var path: String { /* 实现路径逻辑 */ }
      var method: HTTPMethod { /* 实现方法逻辑 */ }
      var headers: [String: String] { /* 实现头部逻辑 */ }
  }
  ```

- [ ] **T008**: 创建 APIClient.swift 网络客户端
  ```swift
  class APIClient: ObservableObject {
      static let shared = APIClient()
      private let session = URLSession.shared
      
      func request<T: Codable>(
          endpoint: APIEndpoint,
          responseType: T.Type
      ) async throws -> T {
          // 实现网络请求逻辑
          // 包含错误处理、重试机制、Token 管理
      }
      
      func upload<T: Codable>(
          endpoint: APIEndpoint,
          data: Data,
          responseType: T.Type
      ) async throws -> T {
          // 实现文件上传逻辑
      }
  }
  ```

- [ ] **T009**: 创建 NetworkError.swift 错误处理
  ```swift
  enum NetworkError: LocalizedError {
      case invalidURL
      case noData
      case decodingError(Error)
      case serverError(Int, String)
      case unauthorized
      case networkUnavailable
      case timeout
      
      var errorDescription: String? {
          // 实现错误描述
      }
      
      var recoverySuggestion: String? {
          // 实现恢复建议
      }
  }
  ```

### 💾 数据存储架构
- [ ] **T010**: 创建 Core Data 模型文件 PromptFlow.xcdatamodeld
  ```
  Entities:
  - CDUser (id, username, email, createdAt, updatedAt)
  - CDPrompt (id, title, content, description, version, isTemplate, category, tags, isPublic, createdAt, updatedAt, syncStatus)
  - CDPromptVersion (id, promptId, version, content, changeNote, createdAt)
  - CDTeam (id, name, description, ownerId, isActive, createdAt, updatedAt)
  - CDTeamMember (id, teamId, userId, role, joinedAt)
  - CDComment (id, promptId, userId, content, isResolved, createdAt, updatedAt)
  ```

- [ ] **T011**: 创建 CoreDataStack.swift 数据栈管理
  ```swift
  class CoreDataStack: ObservableObject {
      static let shared = CoreDataStack()
      
      lazy var persistentContainer: NSPersistentContainer = {
          let container = NSPersistentContainer(name: "PromptFlow")
          container.loadPersistentStores { _, error in
              if let error = error {
                  fatalError("Core Data error: \(error)")
              }
          }
          return container
      }()
      
      var context: NSManagedObjectContext {
          persistentContainer.viewContext
      }
      
      func save() {
          if context.hasChanges {
              try? context.save()
          }
      }
  }
  ```

- [ ] **T012**: 创建数据模型 Models.swift
  ```swift
  // User 模型
  struct User: Codable, Identifiable {
      let id: Int
      let username: String
      let email: String
      let createdAt: Date
      let updatedAt: Date
  }
  
  // Prompt 模型
  struct Prompt: Codable, Identifiable {
      let id: Int
      let title: String
      let content: String
      let description: String?
      let version: Int
      let isTemplate: Bool
      let category: String?
      let tags: [String]?
      let userId: Int
      let parentId: Int?
      let teamId: Int?
      let isPublic: Bool
      let createdAt: Date
      let updatedAt: Date
      let user: User?
      let team: Team?
  }
  
  // 其他模型类似定义...
  ```

---

## 🔐 阶段 2: 用户认证系统

### 🔑 安全存储管理
- [ ] **T013**: 创建 KeychainManager.swift
  ```swift
  class KeychainManager {
      static let shared = KeychainManager()
      private let service = "com.promptflow.ios"
      
      enum KeychainKey: String {
          case authToken = "auth_token"
          case refreshToken = "refresh_token"
          case userCredentials = "user_credentials"
          case biometricEnabled = "biometric_enabled"
      }
      
      func save<T: Codable>(_ value: T, for key: KeychainKey) throws {
          // 实现 Keychain 存储逻辑
      }
      
      func get<T: Codable>(_ type: T.Type, for key: KeychainKey) throws -> T? {
          // 实现 Keychain 读取逻辑
      }
      
      func delete(for key: KeychainKey) throws {
          // 实现 Keychain 删除逻辑
      }
  }
  ```

- [ ] **T014**: 创建 AuthenticationManager.swift
  ```swift
  @Observable
  class AuthenticationManager {
      var user: User?
      var isAuthenticated: Bool { user != nil }
      var authToken: String?
      var isLoading = false
      var error: NetworkError?
      
      func login(email: String, password: String) async throws {
          // 实现登录逻辑
          // 1. 调用登录 API
          // 2. 保存 Token 到 Keychain
          // 3. 更新用户状态
      }
      
      func register(username: String, email: String, password: String) async throws {
          // 实现注册逻辑
      }
      
      func logout() {
          // 实现登出逻辑
          // 1. 清除 Keychain 数据
          // 2. 重置用户状态
          // 3. 清除本地缓存
      }
      
      func refreshToken() async throws {
          // 实现 Token 刷新逻辑
      }
      
      func loadStoredCredentials() {
          // 加载存储的凭据
      }
  }
  ```

- [ ] **T015**: 创建 BiometricManager.swift
  ```swift
  import LocalAuthentication
  
  class BiometricManager: ObservableObject {
      @Published var biometryType: LABiometryType = .none
      @Published var isAvailable = false
      
      func checkBiometryAvailability() {
          // 检查生物识别可用性
      }
      
      func authenticateWithBiometry() async throws -> Bool {
          // 实现生物识别认证
      }
      
      func isBiometryEnabled() -> Bool {
          // 检查是否启用生物识别
      }
      
      func setBiometryEnabled(_ enabled: Bool) {
          // 设置生物识别开关
      }
  }
  ```

### 📱 认证界面组件
- [ ] **T016**: 创建 LoginView.swift
  ```swift
  struct LoginView: View {
      @StateObject private var authManager = AuthenticationManager()
      @StateObject private var biometricManager = BiometricManager()
      
      @State private var email = ""
      @State private var password = ""
      @State private var showPassword = false
      @State private var rememberMe = false
      
      var body: some View {
          NavigationView {
              VStack(spacing: AppSpacing.lg) {
                  // Logo 和标题
                  logoHeader
                  
                  // 登录表单
                  loginForm
                  
                  // 生物识别登录
                  biometricSection
                  
                  // 注册链接
                  signupSection
                  
                  Spacer()
              }
              .padding(AppSpacing.lg)
              .navigationTitle("登录")
          }
      }
      
      private var logoHeader: some View {
          // 实现 Logo 和标题部分
      }
      
      private var loginForm: some View {
          // 实现登录表单部分
      }
      
      private var biometricSection: some View {
          // 实现生物识别部分
      }
      
      private var signupSection: some View {
          // 实现注册链接部分
      }
      
      private func handleLogin() {
          // 处理登录逻辑
      }
      
      private func handleBiometricLogin() {
          // 处理生物识别登录
      }
  }
  ```

- [ ] **T017**: 创建 RegisterView.swift
  ```swift
  struct RegisterView: View {
      @StateObject private var authManager = AuthenticationManager()
      
      @State private var username = ""
      @State private var email = ""
      @State private var password = ""
      @State private var confirmPassword = ""
      @State private var acceptTerms = false
      
      var body: some View {
          NavigationView {
              ScrollView {
                  VStack(spacing: AppSpacing.lg) {
                      // 注册表单
                      registrationForm
                      
                      // 条款和隐私
                      termsSection
                      
                      // 注册按钮
                      registerButton
                      
                      // 登录链接
                      loginSection
                  }
                  .padding(AppSpacing.lg)
              }
              .navigationTitle("注册")
          }
      }
      
      private var registrationForm: some View {
          // 实现注册表单
      }
      
      private var termsSection: some View {
          // 实现条款部分
      }
      
      private var registerButton: some View {
          // 实现注册按钮
      }
      
      private var loginSection: some View {
          // 实现登录链接
      }
      
      private func handleRegister() {
          // 处理注册逻辑
      }
      
      private func validateForm() -> Bool {
          // 表单验证逻辑
      }
  }
  ```

- [ ] **T018**: 创建 AuthenticationRootView.swift
  ```swift
  struct AuthenticationRootView: View {
      @StateObject private var authManager = AuthenticationManager()
      
      var body: some View {
          Group {
              if authManager.isAuthenticated {
                  MainTabView()
                      .transition(.asymmetric(
                          insertion: .move(edge: .trailing),
                          removal: .move(edge: .leading)
                      ))
              } else {
                  LoginView()
                      .transition(.asymmetric(
                          insertion: .move(edge: .leading),
                          removal: .move(edge: .trailing)
                      ))
              }
          }
          .animation(.easeInOut(duration: 0.3), value: authManager.isAuthenticated)
          .onAppear {
              authManager.loadStoredCredentials()
          }
      }
  }
  ```

---

## 📝 阶段 3: 提示词管理功能

### 📋 提示词列表功能
- [ ] **T019**: 创建 PromptListViewModel.swift
  ```swift
  @Observable
  class PromptListViewModel {
      var prompts: [Prompt] = []
      var isLoading = false
      var error: NetworkError?
      var searchText = ""
      var selectedCategory: String?
      var sortOrder: SortOrder = .newest
      
      enum SortOrder: String, CaseIterable {
          case newest = "newest"
          case oldest = "oldest"
          case title = "title"
          case updated = "updated"
          
          var displayName: String {
              switch self {
              case .newest: return "最新"
              case .oldest: return "最旧"
              case .title: return "标题"
              case .updated: return "最近更新"
              }
          }
      }
      
      var filteredPrompts: [Prompt] {
          // 实现搜索和筛选逻辑
      }
      
      func loadPrompts() async {
          // 加载提示词列表
      }
      
      func refreshPrompts() async {
          // 刷新提示词列表
      }
      
      func loadMorePrompts() async {
          // 加载更多提示词
      }
      
      func deletePrompt(_ prompt: Prompt) async {
          // 删除提示词
      }
      
      func toggleFavorite(_ prompt: Prompt) async {
          // 切换收藏状态
      }
  }
  ```

- [ ] **T020**: 创建 PromptListView.swift
  ```swift
  struct PromptListView: View {
      @State private var viewModel = PromptListViewModel()
      @State private var showingCreatePrompt = false
      @State private var showingSearch = false
      @State private var showingFilter = false
      
      var body: some View {
          NavigationView {
              VStack {
                  // 搜索栏
                  if showingSearch {
                      searchBar
                  }
                  
                  // 筛选栏
                  filterBar
                  
                  // 提示词列表
                  promptList
              }
              .navigationTitle("我的提示词")
              .toolbar {
                  toolbarContent
              }
              .searchable(text: $viewModel.searchText, isPresented: $showingSearch)
              .refreshable {
                  await viewModel.refreshPrompts()
              }
              .sheet(isPresented: $showingCreatePrompt) {
                  PromptEditorView()
              }
              .sheet(isPresented: $showingFilter) {
                  PromptFilterView(viewModel: viewModel)
              }
          }
          .task {
              await viewModel.loadPrompts()
          }
      }
      
      private var searchBar: some View {
          // 实现搜索栏
      }
      
      private var filterBar: some View {
          // 实现筛选栏
      }
      
      private var promptList: some View {
          // 实现提示词列表
      }
      
      @ToolbarContentBuilder
      private var toolbarContent: some ToolbarContent {
          // 实现工具栏内容
      }
  }
  ```

- [ ] **T021**: 创建 PromptRowView.swift
  ```swift
  struct PromptRowView: View {
      let prompt: Prompt
      let onFavorite: () -> Void
      let onShare: () -> Void
      let onDelete: () -> Void
      
      @State private var showingActions = false
      
      var body: some View {
          VStack(alignment: .leading, spacing: AppSpacing.sm) {
              // 标题和状态
              headerSection
              
              // 内容预览
              contentPreview
              
              // 元数据信息
              metadataSection
              
              // 标签
              if let tags = prompt.tags, !tags.isEmpty {
                  tagsSection(tags)
              }
          }
          .padding(AppSpacing.md)
          .background(AppColors.secondaryBackground)
          .cornerRadius(AppSpacing.cornerRadius)
          .contextMenu {
              contextMenuContent
          }
          .swipeActions(edge: .trailing, allowsFullSwipe: false) {
              swipeActions
          }
      }
      
      private var headerSection: some View {
          // 实现标题和状态部分
      }
      
      private var contentPreview: some View {
          // 实现内容预览部分
      }
      
      private var metadataSection: some View {
          // 实现元数据部分
      }
      
      private func tagsSection(_ tags: [String]) -> some View {
          // 实现标签部分
      }
      
      @ViewBuilder
      private var contextMenuContent: some View {
          // 实现上下文菜单
      }
      
      @ViewBuilder
      private var swipeActions: some View {
          // 实现滑动操作
      }
  }
  ```

### 📖 提示词详情功能
- [ ] **T022**: 创建 PromptDetailViewModel.swift
  ```swift
  @Observable
  class PromptDetailViewModel {
      var prompt: Prompt?
      var versions: [PromptVersion] = []
      var comments: [Comment] = []
      var isLoading = false
      var error: NetworkError?
      var selectedTab: DetailTab = .content
      
      enum DetailTab: String, CaseIterable {
          case content = "content"
          case versions = "versions"
          case comments = "comments"
          case analysis = "analysis"
          
          var displayName: String {
              switch self {
              case .content: return "内容"
              case .versions: return "版本"
              case .comments: return "评论"
              case .analysis: return "AI分析"
              }
          }
      }
      
      func loadPromptDetail(_ promptId: Int) async {
          // 加载提示词详情
      }
      
      func loadVersions() async {
          // 加载版本历史
      }
      
      func loadComments() async {
          // 加载评论
      }
      
      func revertToVersion(_ version: PromptVersion) async {
          // 回滚到指定版本
      }
      
      func addComment(_ content: String) async {
          // 添加评论
      }
      
      func deleteComment(_ comment: Comment) async {
          // 删除评论
      }
  }
  ```

- [ ] **T023**: 创建 PromptDetailView.swift
  ```swift
  struct PromptDetailView: View {
      let promptId: Int
      @State private var viewModel = PromptDetailViewModel()
      @State private var showingEditor = false
      
      var body: some View {
          VStack {
              if let prompt = viewModel.prompt {
                  // 标题头部
                  promptHeader(prompt)
                  
                  // 标签页切换
                  tabSelector
                  
                  // 内容区域
                  TabView(selection: $viewModel.selectedTab) {
                      contentTab(prompt)
                          .tag(PromptDetailViewModel.DetailTab.content)
                      
                      versionsTab
                          .tag(PromptDetailViewModel.DetailTab.versions)
                      
                      commentsTab
                          .tag(PromptDetailViewModel.DetailTab.comments)
                      
                      analysisTab(prompt)
                          .tag(PromptDetailViewModel.DetailTab.analysis)
                  }
                  .tabViewStyle(.page(indexDisplayMode: .never))
              } else if viewModel.isLoading {
                  loadingView
              } else if viewModel.error != nil {
                  errorView
              }
          }
          .navigationBarTitleDisplayMode(.inline)
          .toolbar {
              toolbarContent
          }
          .task {
              await viewModel.loadPromptDetail(promptId)
          }
          .sheet(isPresented: $showingEditor) {
              if let prompt = viewModel.prompt {
                  PromptEditorView(prompt: prompt)
              }
          }
      }
      
      private func promptHeader(_ prompt: Prompt) -> some View {
          // 实现提示词头部
      }
      
      private var tabSelector: some View {
          // 实现标签页选择器
      }
      
      private func contentTab(_ prompt: Prompt) -> some View {
          // 实现内容标签页
      }
      
      private var versionsTab: some View {
          // 实现版本标签页
      }
      
      private var commentsTab: some View {
          // 实现评论标签页
      }
      
      private func analysisTab(_ prompt: Prompt) -> some View {
          // 实现AI分析标签页
      }
      
      private var loadingView: some View {
          // 实现加载视图
      }
      
      private var errorView: some View {
          // 实现错误视图
      }
      
      @ToolbarContentBuilder
      private var toolbarContent: some ToolbarContent {
          // 实现工具栏内容
      }
  }
  ```

### ✏️ 提示词编辑功能
- [ ] **T024**: 创建 PromptEditorViewModel.swift
  ```swift
  @Observable
  class PromptEditorViewModel {
      var title = ""
      var content = ""
      var description = ""
      var category = ""
      var tags: [String] = []
      var isTemplate = false
      var isPublic = false
      
      var isLoading = false
      var error: NetworkError?
      var hasChanges = false
      
      private var originalPrompt: Prompt?
      
      init(prompt: Prompt? = nil) {
          if let prompt = prompt {
              loadPrompt(prompt)
          }
      }
      
      func loadPrompt(_ prompt: Prompt) {
          // 加载提示词数据到编辑器
      }
      
      func savePrompt() async throws {
          // 保存提示词
      }
      
      func saveDraft() async {
          // 保存草稿
      }
      
      func loadDraft() {
          // 加载草稿
      }
      
      func validateForm() -> Bool {
          // 验证表单
      }
      
      func trackChanges() {
          // 跟踪变更
      }
      
      func addTag(_ tag: String) {
          // 添加标签
      }
      
      func removeTag(_ tag: String) {
          // 移除标签
      }
  }
  ```

- [ ] **T025**: 创建 PromptEditorView.swift
  ```swift
  struct PromptEditorView: View {
      @State private var viewModel: PromptEditorViewModel
      @Environment(\.dismiss) private var dismiss
      
      @State private var showingPreview = false
      @State private var showingDiscardAlert = false
      
      init(prompt: Prompt? = nil) {
          _viewModel = State(initialValue: PromptEditorViewModel(prompt: prompt))
      }
      
      var body: some View {
          NavigationView {
              Form {
                  // 基本信息部分
                  basicInfoSection
                  
                  // 内容编辑部分
                  contentSection
                  
                  // 分类和标签部分
                  categoryTagsSection
                  
                  // 设置部分
                  settingsSection
              }
              .navigationTitle(viewModel.originalPrompt == nil ? "新建提示词" : "编辑提示词")
              .navigationBarTitleDisplayMode(.inline)
              .toolbar {
                  toolbarContent
              }
              .alert("放弃更改", isPresented: $showingDiscardAlert) {
                  discardAlert
              }
              .sheet(isPresented: $showingPreview) {
                  PromptPreviewView(
                      title: viewModel.title,
                      content: viewModel.content
                  )
              }
          }
      }
      
      private var basicInfoSection: some View {
          Section("基本信息") {
              TextField("标题", text: $viewModel.title)
                  .textFieldStyle(.roundedBorder)
              
              TextField("描述", text: $viewModel.description, axis: .vertical)
                  .textFieldStyle(.roundedBorder)
                  .lineLimit(3...6)
          }
      }
      
      private var contentSection: some View {
          Section("内容") {
              CodeEditorView(
                  content: $viewModel.content,
                  language: .prompt,
                  theme: .xcode
              )
              .frame(minHeight: 200)
          }
      }
      
      private var categoryTagsSection: some View {
          Section("分类和标签") {
              // 实现分类选择器
              CategoryPicker(selection: $viewModel.category)
              
              // 实现标签编辑器
              TagEditor(tags: $viewModel.tags)
          }
      }
      
      private var settingsSection: some View {
          Section("设置") {
              Toggle("设为模板", isOn: $viewModel.isTemplate)
              Toggle("公开提示词", isOn: $viewModel.isPublic)
          }
      }
      
      @ToolbarContentBuilder
      private var toolbarContent: some ToolbarContent {
          ToolbarItem(placement: .navigationBarLeading) {
              Button("取消") {
                  handleCancel()
              }
          }
          
          ToolbarItem(placement: .navigationBarTrailing) {
              HStack {
                  Button("预览") {
                      showingPreview = true
                  }
                  .disabled(viewModel.title.isEmpty || viewModel.content.isEmpty)
                  
                  Button("保存") {
                      Task {
                          await handleSave()
                      }
                  }
                  .disabled(!viewModel.validateForm() || viewModel.isLoading)
              }
          }
      }
      
      @ViewBuilder
      private var discardAlert: some View {
          Button("放弃", role: .destructive) {
              dismiss()
          }
          Button("取消", role: .cancel) { }
      }
      
      private func handleCancel() {
          if viewModel.hasChanges {
              showingDiscardAlert = true
          } else {
              dismiss()
          }
      }
      
      private func handleSave() async {
          do {
              try await viewModel.savePrompt()
              dismiss()
          } catch {
              // 处理保存错误
          }
      }
  }
  ```

---

## 🤖 阶段 4: AI 优化功能

### 🧠 AI 服务集成
- [ ] **T026**: 创建 AIService.swift
  ```swift
  class AIService: ObservableObject {
      static let shared = AIService()
      
      func analyzePrompt(_ content: String) async throws -> AnalysisResult {
          let endpoint = APIEndpoint.analyzePrompt(content: content)
          return try await APIClient.shared.request(
              endpoint: endpoint,
              responseType: AnalysisResult.self
          )
      }
      
      func optimizePrompt(_ request: OptimizeRequest) async throws -> OptimizeResponse {
          let endpoint = APIEndpoint.optimizePrompt(request)
          return try await APIClient.shared.request(
              endpoint: endpoint,
              responseType: OptimizeResponse.self
          )
      }
      
      func findSimilarPrompts(_ content: String) async throws -> [SimilarPrompt] {
          let endpoint = APIEndpoint.findSimilar(content: content)
          let response = try await APIClient.shared.request(
              endpoint: endpoint,
              responseType: SimilarPromptsResponse.self
          )
          return response.data
      }
      
      func categorizePrompt(_ content: String) async throws -> [String] {
          let endpoint = APIEndpoint.categorize(content: content)
          let response = try await APIClient.shared.request(
              endpoint: endpoint,
              responseType: CategorizeResponse.self
          )
          return response.categories
      }
      
      func getUserInsights() async throws -> UserInsights {
          let endpoint = APIEndpoint.getInsights
          return try await APIClient.shared.request(
              endpoint: endpoint,
              responseType: UserInsights.self
          )
      }
  }
  
  // AI 相关数据模型
  struct AnalysisResult: Codable {
      let score: Int
      let strengths: [String]
      let weaknesses: [String]
      let suggestions: [Suggestion]
      let estimatedTokens: Int
      let readabilityScore: Int
  }
  
  struct Suggestion: Codable, Identifiable {
      let id = UUID()
      let type: String
      let title: String
      let description: String
      let example: String?
      let confidence: Double
      let impact: String
      
      private enum CodingKeys: String, CodingKey {
          case type, title, description, example, confidence, impact
      }
  }
  
  struct OptimizeRequest: Codable {
      let content: String
      let suggestions: [String]
      let targetAudience: String?
      let optimizationGoal: String?
  }
  
  struct OptimizeResponse: Codable {
      let optimizedContent: String
      let improvements: [String]
      let changesSummary: String
  }
  ```

- [ ] **T027**: 创建 AIAnalysisViewModel.swift
  ```swift
  @Observable
  class AIAnalysisViewModel {
      var analysisResult: AnalysisResult?
      var similarPrompts: [SimilarPrompt] = []
      var suggestedCategories: [String] = []
      var optimizedContent: String?
      
      var isAnalyzing = false
      var isOptimizing = false
      var error: NetworkError?
      
      func analyzePrompt(_ content: String) async {
          isAnalyzing = true
          error = nil
          
          do {
              async let analysis = AIService.shared.analyzePrompt(content)
              async let similar = AIService.shared.findSimilarPrompts(content)
              async let categories = AIService.shared.categorizePrompt(content)
              
              analysisResult = try await analysis
              similarPrompts = try await similar
              suggestedCategories = try await categories
          } catch {
              self.error = error as? NetworkError ?? .networkUnavailable
          }
          
          isAnalyzing = false
      }
      
      func optimizePrompt(_ content: String, suggestions: [Suggestion]) async {
          isOptimizing = true
          error = nil
          
          do {
              let request = OptimizeRequest(
                  content: content,
                  suggestions: suggestions.map { $0.type },
                  targetAudience: nil,
                  optimizationGoal: nil
              )
              
              let response = try await AIService.shared.optimizePrompt(request)
              optimizedContent = response.optimizedContent
          } catch {
              self.error = error as? NetworkError ?? .networkUnavailable
          }
          
          isOptimizing = false
      }
      
      func applyOptimization() -> String? {
          return optimizedContent
      }
      
      func clearAnalysis() {
          analysisResult = nil
          similarPrompts = []
          suggestedCategories = []
          optimizedContent = nil
          error = nil
      }
  }
  ```

- [ ] **T028**: 创建 AIAnalysisView.swift
  ```swift
  struct AIAnalysisView: View {
      let prompt: Prompt
      @State private var viewModel = AIAnalysisViewModel()
      @State private var selectedSuggestions: Set<String> = []
      @State private var showingOptimizedContent = false
      
      var body: some View {
          ScrollView {
              VStack(alignment: .leading, spacing: AppSpacing.lg) {
                  if viewModel.isAnalyzing {
                      analysisLoadingView
                  } else if let analysis = viewModel.analysisResult {
                      // 质量评分卡片
                      scoreCardView(analysis)
                      
                      // 优化建议
                      suggestionsView(analysis.suggestions)
                      
                      // 优化按钮
                      optimizeButtonView
                      
                      // 相似推荐
                      if !viewModel.similarPrompts.isEmpty {
                          similarPromptsView
                      }
                      
                      // 建议分类
                      if !viewModel.suggestedCategories.isEmpty {
                          suggestedCategoriesView
                      }
                  } else if let error = viewModel.error {
                      errorView(error)
                  } else {
                      emptyStateView
                  }
              }
              .padding(AppSpacing.lg)
          }
          .navigationTitle("AI 分析")
          .task {
              await viewModel.analyzePrompt(prompt.content)
          }
          .sheet(isPresented: $showingOptimizedContent) {
              if let optimized = viewModel.optimizedContent {
                  OptimizedContentView(
                      original: prompt.content,
                      optimized: optimized
                  )
              }
          }
      }
      
      private var analysisLoadingView: some View {
          VStack(spacing: AppSpacing.md) {
              ProgressView()
                  .scaleEffect(1.5)
              Text("AI 正在分析您的提示词...")
                  .font(AppTypography.body)
                  .foregroundColor(.secondary)
          }
          .frame(maxWidth: .infinity, minHeight: 200)
      }
      
      private func scoreCardView(_ analysis: AnalysisResult) -> some View {
          VStack(alignment: .leading, spacing: AppSpacing.md) {
              Text("质量评分")
                  .font(AppTypography.headline)
              
              HStack {
                  CircularProgressView(
                      progress: Double(analysis.score) / 100.0,
                      score: analysis.score
                  )
                  .frame(width: 80, height: 80)
                  
                  VStack(alignment: .leading, spacing: AppSpacing.sm) {
                      Text("可读性: \(analysis.readabilityScore)")
                      Text("预估 Token: \(analysis.estimatedTokens)")
                      Text("改进建议: \(analysis.suggestions.count) 条")
                  }
                  .font(AppTypography.caption)
                  .foregroundColor(.secondary)
                  
                  Spacer()
              }
              
              // 优势和劣势
              if !analysis.strengths.isEmpty {
                  strengthsView(analysis.strengths)
              }
              
              if !analysis.weaknesses.isEmpty {
                  weaknessesView(analysis.weaknesses)
              }
          }
          .padding(AppSpacing.md)
          .background(AppColors.secondaryBackground)
          .cornerRadius(AppSpacing.cornerRadius)
      }
      
      private func suggestionsView(_ suggestions: [Suggestion]) -> some View {
          VStack(alignment: .leading, spacing: AppSpacing.md) {
              Text("优化建议")
                  .font(AppTypography.headline)
              
              ForEach(suggestions) { suggestion in
                  SuggestionRowView(
                      suggestion: suggestion,
                      isSelected: selectedSuggestions.contains(suggestion.type)
                  ) {
                      toggleSuggestionSelection(suggestion.type)
                  }
              }
          }
      }
      
      private var optimizeButtonView: some View {
          Button(action: handleOptimize) {
              HStack {
                  if viewModel.isOptimizing {
                      ProgressView()
                        .tint(.white)
                  } else {
                      Image(systemName: "wand.and.stars")
                      Text("应用优化建议")
                  }
              }
              .frame(maxWidth: .infinity)
              .frame(height: AppSpacing.buttonHeight)
              .background(AppColors.primary)
              .foregroundColor(.white)
              .cornerRadius(AppSpacing.cornerRadius)
          }
          .disabled(selectedSuggestions.isEmpty || viewModel.isOptimizing)
      }
      
      private var similarPromptsView: some View {
          VStack(alignment: .leading, spacing: AppSpacing.md) {
              Text("相似推荐")
                  .font(AppTypography.headline)
              
              ScrollView(.horizontal, showsIndicators: false) {
                  HStack(spacing: AppSpacing.md) {
                      ForEach(viewModel.similarPrompts, id: \.id) { similar in
                          SimilarPromptCard(prompt: similar)
                      }
                  }
                  .padding(.horizontal, AppSpacing.lg)
              }
          }
      }
      
      private var suggestedCategoriesView: some View {
          VStack(alignment: .leading, spacing: AppSpacing.md) {
              Text("建议分类")
                  .font(AppTypography.headline)
              
              FlowLayout(spacing: AppSpacing.sm) {
                  ForEach(viewModel.suggestedCategories, id: \.self) { category in
                      CategoryTag(category: category)
                  }
              }
          }
      }
      
      private func errorView(_ error: NetworkError) -> some View {
          VStack(spacing: AppSpacing.md) {
              Image(systemName: "exclamationmark.triangle")
                  .font(.system(size: 48))
                  .foregroundColor(.secondary)
              
              Text("分析失败")
                  .font(AppTypography.headline)
              
              Text(error.localizedDescription)
                  .font(AppTypography.body)
                  .foregroundColor(.secondary)
                  .multilineTextAlignment(.center)
              
              Button("重试") {
                  Task {
                      await viewModel.analyzePrompt(prompt.content)
                  }
              }
              .buttonStyle(.bordered)
          }
          .frame(maxWidth: .infinity, minHeight: 200)
      }
      
      private var emptyStateView: some View {
          VStack(spacing: AppSpacing.md) {
              Image(systemName: "brain")
                  .font(.system(size: 48))
                  .foregroundColor(.secondary)
              
              Text("开始 AI 分析")
                  .font(AppTypography.headline)
              
              Text("点击分析按钮获取智能优化建议")
                  .font(AppTypography.body)
                  .foregroundColor(.secondary)
                  .multilineTextAlignment(.center)
              
              Button("分析提示词") {
                  Task {
                      await viewModel.analyzePrompt(prompt.content)
                  }
              }
              .buttonStyle(.borderedProminent)
          }
          .frame(maxWidth: .infinity, minHeight: 200)
      }
      
      private func strengthsView(_ strengths: [String]) -> some View {
          VStack(alignment: .leading, spacing: AppSpacing.sm) {
              HStack {
                  Image(systemName: "checkmark.circle.fill")
                      .foregroundColor(AppColors.success)
                  Text("优势")
                      .font(AppTypography.caption)
                      .fontWeight(.semibold)
              }
              
              ForEach(strengths, id: \.self) { strength in
                  Text("• \(strength)")
                      .font(AppTypography.caption)
                      .foregroundColor(.secondary)
              }
          }
      }
      
      private func weaknessesView(_ weaknesses: [String]) -> some View {
          VStack(alignment: .leading, spacing: AppSpacing.sm) {
              HStack {
                  Image(systemName: "exclamationmark.triangle.fill")
                      .foregroundColor(AppColors.warning)
                  Text("待改进")
                      .font(AppTypography.caption)
                      .fontWeight(.semibold)
              }
              
              ForEach(weaknesses, id: \.self) { weakness in
                  Text("• \(weakness)")
                      .font(AppTypography.caption)
                      .foregroundColor(.secondary)
              }
          }
      }
      
      private func toggleSuggestionSelection(_ type: String) {
          if selectedSuggestions.contains(type) {
              selectedSuggestions.remove(type)
          } else {
              selectedSuggestions.insert(type)
          }
      }
      
      private func handleOptimize() {
          guard let analysis = viewModel.analysisResult else { return }
          
          let selectedSuggestionObjects = analysis.suggestions.filter {
              selectedSuggestions.contains($0.type)
          }
          
          Task {
              await viewModel.optimizePrompt(prompt.content, suggestions: selectedSuggestionObjects)
              if viewModel.optimizedContent != nil {
                  showingOptimizedContent = true
              }
          }
      }
  }
  ```

---

## 👥 阶段 5: 团队协作功能

### 🏢 团队管理核心
- [ ] **T029**: 创建 TeamManager.swift
  ```swift
  @Observable
  class TeamManager {
      var teams: [Team] = []
      var currentTeam: Team?
      var isLoading = false
      var error: NetworkError?
      
      func loadTeams() async {
          isLoading = true
          error = nil
          
          do {
              let response = try await APIClient.shared.request(
                  endpoint: .getTeams,
                  responseType: TeamsResponse.self
              )
              teams = response.data
          } catch {
              self.error = error as? NetworkError ?? .networkUnavailable
          }
          
          isLoading = false
      }
      
      func createTeam(name: String, description: String) async throws -> Team {
          let request = TeamRequest(name: name, description: description)
          let response = try await APIClient.shared.request(
              endpoint: .createTeam(request),
              responseType: TeamResponse.self
          )
          
          let newTeam = response.data
          teams.append(newTeam)
          return newTeam
      }
      
      func loadTeamDetail(_ teamId: Int) async throws -> TeamDetail {
          return try await APIClient.shared.request(
              endpoint: .getTeamDetail(id: teamId),
              responseType: TeamDetail.self
          )
      }
      
      func inviteMember(teamId: Int, email: String, role: TeamRole) async throws {
          let request = MemberRequest(email: email, role: role.rawValue)
          try await APIClient.shared.request(
              endpoint: .inviteMember(teamId: teamId, request),
              responseType: SuccessResponse.self
          )
      }
      
      func updateMemberRole(teamId: Int, memberId: Int, role: TeamRole) async throws {
          try await APIClient.shared.request(
              endpoint: .updateMemberRole(teamId: teamId, memberId: memberId, role: role.rawValue),
              responseType: SuccessResponse.self
          )
      }
      
      func leaveTeam(_ teamId: Int) async throws {
          // 实现离开团队逻辑
      }
      
      func deleteTeam(_ teamId: Int) async throws {
          // 实现删除团队逻辑
      }
  }
  
  enum TeamRole: String, CaseIterable {
      case owner = "owner"
      case admin = "admin"
      case editor = "editor"
      case viewer = "viewer"
      
      var displayName: String {
          switch self {
          case .owner: return "所有者"
          case .admin: return "管理员"
          case .editor: return "编辑者"
          case .viewer: return "查看者"
          }
      }
      
      var permissions: [Permission] {
          switch self {
          case .owner:
              return Permission.allCases
          case .admin:
              return [.read, .write, .invite, .manage]
          case .editor:
              return [.read, .write]
          case .viewer:
              return [.read]
          }
      }
  }
  
  enum Permission: CaseIterable {
      case read
      case write
      case invite
      case manage
      case delete
  }
  ```

- [ ] **T030**: 创建 TeamListView.swift
  ```swift
  struct TeamListView: View {
      @State private var teamManager = TeamManager()
      @State private var showingCreateTeam = false
      
      var body: some View {
          NavigationView {
              VStack {
                  if teamManager.isLoading && teamManager.teams.isEmpty {
                      loadingView
                  } else if teamManager.teams.isEmpty {
                      emptyStateView
                  } else {
                      teamList
                  }
              }
              .navigationTitle("我的团队")
              .toolbar {
                  ToolbarItem(placement: .navigationBarTrailing) {
                      Button(action: { showingCreateTeam = true }) {
                          Image(systemName: "plus")
                      }
                  }
              }
              .refreshable {
                  await teamManager.loadTeams()
              }
              .sheet(isPresented: $showingCreateTeam) {
                  CreateTeamView(teamManager: teamManager)
              }
          }
          .task {
              await teamManager.loadTeams()
          }
      }
      
      private var loadingView: some View {
          VStack(spacing: AppSpacing.md) {
              ProgressView()
              Text("加载团队中...")
                  .foregroundColor(.secondary)
          }
          .frame(maxWidth: .infinity, maxHeight: .infinity)
      }
      
      private var emptyStateView: some View {
          VStack(spacing: AppSpacing.lg) {
              Image(systemName: "person.3")
                  .font(.system(size: 64))
                  .foregroundColor(.secondary)
              
              VStack(spacing: AppSpacing.sm) {
                  Text("还没有团队")
                      .font(AppTypography.headline)
                  
                  Text("创建团队与同事协作管理提示词")
                      .font(AppTypography.body)
                      .foregroundColor(.secondary)
                      .multilineTextAlignment(.center)
              }
              
              Button(action: { showingCreateTeam = true }) {
                  Label("创建团队", systemImage: "plus")
              }
              .buttonStyle(.borderedProminent)
          }
          .padding(AppSpacing.xl)
          .frame(maxWidth: .infinity, maxHeight: .infinity)
      }
      
      private var teamList: some View {
          List {
              ForEach(teamManager.teams) { team in
                  NavigationLink(destination: TeamDetailView(teamId: team.id)) {
                      TeamRowView(team: team)
                  }
                  .listRowInsets(EdgeInsets(
                      top: AppSpacing.sm,
                      leading: AppSpacing.md,
                      bottom: AppSpacing.sm,
                      trailing: AppSpacing.md
                  ))
              }
          }
          .listStyle(.plain)
      }
  }
  ```

- [ ] **T031**: 创建 TeamDetailView.swift
  ```swift
  struct TeamDetailView: View {
      let teamId: Int
      @State private var teamDetail: TeamDetail?
      @State private var isLoading = true
      @State private var error: NetworkError?
      @State private var selectedTab: DetailTab = .prompts
      @State private var showingInviteMember = false
      @State private var showingSettings = false
      
      enum DetailTab: String, CaseIterable {
          case prompts = "prompts"
          case members = "members"
          case activity = "activity"
          
          var displayName: String {
              switch self {
              case .prompts: return "提示词"
              case .members: return "成员"
              case .activity: return "动态"
              }
          }
          
          var icon: String {
              switch self {
              case .prompts: return "doc.text"
              case .members: return "person.2"
              case .activity: return "clock"
              }
          }
      }
      
      var body: some View {
          VStack {
              if isLoading {
                  loadingView
              } else if let teamDetail = teamDetail {
                  VStack(spacing: 0) {
                      // 团队头部信息
                      teamHeader(teamDetail.team)
                      
                      // 标签页选择器
                      tabSelector
                      
                      // 内容区域
                      TabView(selection: $selectedTab) {
                          TeamPromptsView(teamId: teamId)
                              .tag(DetailTab.prompts)
                          
                          TeamMembersView(
                              teamId: teamId,
                              members: teamDetail.members,
                              currentUserRole: teamDetail.currentUserRole
                          )
                          .tag(DetailTab.members)
                          
                          TeamActivityView(teamId: teamId)
                              .tag(DetailTab.activity)
                      }
                      .tabViewStyle(.page(indexDisplayMode: .never))
                  }
              } else if let error = error {
                  errorView(error)
              }
          }
          .navigationBarTitleDisplayMode(.inline)
          .toolbar {
              toolbarContent
          }
          .task {
              await loadTeamDetail()
          }
          .sheet(isPresented: $showingInviteMember) {
              if let teamDetail = teamDetail {
                  InviteMemberView(
                      teamId: teamId,
                      currentUserRole: teamDetail.currentUserRole
                  )
              }
          }
          .sheet(isPresented: $showingSettings) {
              if let teamDetail = teamDetail {
                  TeamSettingsView(
                      team: teamDetail.team,
                      currentUserRole: teamDetail.currentUserRole
                  )
              }
          }
      }
      
      private var loadingView: some View {
          ProgressView("加载团队信息...")
              .frame(maxWidth: .infinity, maxHeight: .infinity)
      }
      
      private func teamHeader(_ team: Team) -> some View {
          VStack(spacing: AppSpacing.md) {
              // 团队头像
              Circle()
                  .fill(AppColors.primary.gradient)
                  .frame(width: 80, height: 80)
                  .overlay {
                      Text(String(team.name.prefix(1)).uppercased())
                          .font(.system(size: 32, weight: .bold))
                          .foregroundColor(.white)
                  }
              
              VStack(spacing: AppSpacing.xs) {
                  Text(team.name)
                      .font(AppTypography.title2)
                      .fontWeight(.bold)
                  
                  if let description = team.description {
                      Text(description)
                          .font(AppTypography.body)
                          .foregroundColor(.secondary)
                          .multilineTextAlignment(.center)
                  }
                  
                  if let memberCount = teamDetail?.members.count {
                      Text("\(memberCount) 名成员")
                          .font(AppTypography.caption)
                          .foregroundColor(.secondary)
                  }
              }
          }
          .padding(AppSpacing.lg)
          .background(AppColors.secondaryBackground)
      }
      
      private var tabSelector: some View {
          HStack {
              ForEach(DetailTab.allCases, id: \.self) { tab in
                  Button(action: { selectedTab = tab }) {
                      VStack(spacing: AppSpacing.xs) {
                          Image(systemName: tab.icon)
                              .font(.system(size: 20))
                          Text(tab.displayName)
                              .font(AppTypography.caption)
                      }
                      .foregroundColor(selectedTab == tab ? AppColors.primary : .secondary)
                      .frame(maxWidth: .infinity)
                  }
              }
          }
          .padding(.vertical, AppSpacing.sm)
          .background(AppColors.background)
      }
      
      private func errorView(_ error: NetworkError) -> some View {
          VStack(spacing: AppSpacing.md) {
              Image(systemName: "exclamationmark.triangle")
                  .font(.system(size: 48))
                  .foregroundColor(.secondary)
              
              Text("加载失败")
                  .font(AppTypography.headline)
              
              Text(error.localizedDescription)
                  .font(AppTypography.body)
                  .foregroundColor(.secondary)
                  .multilineTextAlignment(.center)
              
              Button("重试") {
                  Task {
                      await loadTeamDetail()
                  }
              }
              .buttonStyle(.bordered)
          }
          .padding(AppSpacing.xl)
          .frame(maxWidth: .infinity, maxHeight: .infinity)
      }
      
      @ToolbarContentBuilder
      private var toolbarContent: some ToolbarContent {
          ToolbarItem(placement: .navigationBarTrailing) {
              Menu {
                  if teamDetail?.currentUserRole.permissions.contains(.invite) == true {
                      Button(action: { showingInviteMember = true }) {
                          Label("邀请成员", systemImage: "person.badge.plus")
                      }
                  }
                  
                  if teamDetail?.currentUserRole.permissions.contains(.manage) == true {
                      Button(action: { showingSettings = true }) {
                          Label("团队设置", systemImage: "gear")
                      }
                  }
                  
                  Button(action: {}) {
                      Label("分享团队", systemImage: "square.and.arrow.up")
                  }
              } label: {
                  Image(systemName: "ellipsis.circle")
              }
          }
      }
      
      private func loadTeamDetail() async {
          isLoading = true
          error = nil
          
          do {
              teamDetail = try await TeamManager().loadTeamDetail(teamId)
          } catch {
              self.error = error as? NetworkError ?? .networkUnavailable
          }
          
          isLoading = false
      }
  }
  ```

### 💬 评论系统
- [ ] **T032**: 创建 CommentManager.swift
  ```swift
  @Observable
  class CommentManager {
      var comments: [Comment] = []
      var isLoading = false
      var error: NetworkError?
      
      func loadComments(for promptId: Int) async {
          isLoading = true
          error = nil
          
          do {
              let response = try await APIClient.shared.request(
                  endpoint: .getComments(promptId: promptId),
                  responseType: CommentsResponse.self
              )
              comments = response.data
          } catch {
              self.error = error as? NetworkError ?? .networkUnavailable
          }
          
          isLoading = false
      }
      
      func addComment(promptId: Int, content: String, parentId: Int? = nil) async throws -> Comment {
          let request = CommentRequest(
              promptId: promptId,
              content: content,
              parentId: parentId
          )
          
          let response = try await APIClient.shared.request(
              endpoint: .createComment(request),
              responseType: CommentResponse.self
          )
          
          let newComment = response.data
          comments.append(newComment)
          return newComment
      }
      
      func updateComment(_ commentId: Int, content: String) async throws {
          try await APIClient.shared.request(
              endpoint: .updateComment(id: commentId, content: content),
              responseType: SuccessResponse.self
          )
          
          // 更新本地评论
          if let index = comments.firstIndex(where: { $0.id == commentId }) {
              comments[index].content = content
              comments[index].updatedAt = Date()
          }
      }
      
      func deleteComment(_ commentId: Int) async throws {
          try await APIClient.shared.request(
              endpoint: .deleteComment(id: commentId),
              responseType: SuccessResponse.self
          )
          
          // 从本地移除评论
          comments.removeAll { $0.id == commentId }
      }
      
      func toggleResolved(_ commentId: Int) async throws {
          // 实现切换解决状态
      }
      
      func reportComment(_ commentId: Int, reason: String) async throws {
          // 实现举报评论
      }
  }
  
  struct Comment: Codable, Identifiable {
      let id: Int
      var content: String
      let promptId: Int
      let userId: Int
      let parentId: Int?
      var isResolved: Bool
      let createdAt: Date
      var updatedAt: Date
      let user: User
      let replies: [Comment]?
      
      var canEdit: Bool {
          // 检查是否可以编辑（当前用户是作者或管理员）
          return true // 实际逻辑需要根据当前用户判断
      }
      
      var canDelete: Bool {
          // 检查是否可以删除
          return true // 实际逻辑需要根据当前用户判断
      }
  }
  ```

- [ ] **T033**: 创建 CommentsView.swift
  ```swift
  struct CommentsView: View {
      let promptId: Int
      @State private var commentManager = CommentManager()
      @State private var newCommentText = ""
      @State private var replyingTo: Comment?
      @State private var showingActionSheet = false
      @State private var selectedComment: Comment?
      
      var body: some View {
          VStack(spacing: 0) {
              // 评论列表
              commentsList
              
              // 评论输入区域
              commentInputArea
          }
          .task {
              await commentManager.loadComments(for: promptId)
          }
          .actionSheet(isPresented: $showingActionSheet) {
              commentActionSheet
          }
      }
      
      private var commentsList: some View {
          ScrollView {
              LazyVStack(alignment: .leading, spacing: AppSpacing.md) {
                  if commentManager.isLoading && commentManager.comments.isEmpty {
                      loadingView
                  } else if commentManager.comments.isEmpty {
                      emptyCommentsView
                  } else {
                      ForEach(commentManager.comments) { comment in
                          CommentRowView(
                              comment: comment,
                              onReply: { replyingTo = comment },
                              onEdit: { editComment(comment) },
                              onDelete: { deleteComment(comment) },
                              onReport: { reportComment(comment) }
                          )
                      }
                  }
              }
              .padding(AppSpacing.md)
          }
      }
      
      private var commentInputArea: some View {
          VStack(alignment: .leading, spacing: AppSpacing.sm) {
              // 回复指示器
              if let replyingTo = replyingTo {
                  replyIndicator(replyingTo)
              }
              
              // 输入框
            HStack(alignment: .bottom, spacing: AppSpacing.sm) {
                  TextField(
                      replyingTo != nil ? "回复评论..." : "添加评论...",
                      text: $newCommentText,
                      axis: .vertical
                  )
                  .textFieldStyle(.roundedBorder)
                  .lineLimit(1...4)
                  
                  Button(action: submitComment) {
                      Image(systemName: "paperplane.fill")
                          .foregroundColor(newCommentText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? .secondary : AppColors.primary)
                  }
                  .disabled(newCommentText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
              }
          }
          .padding(AppSpacing.md)
          .background(AppColors.secondaryBackground)
      }
      
      private var loadingView: some View {
          VStack(spacing: AppSpacing.md) {
              ProgressView()
              Text("加载评论中...")
                  .foregroundColor(.secondary)
          }
          .frame(maxWidth: .infinity, minHeight: 100)
      }
      
      private var emptyCommentsView: some View {
          VStack(spacing: AppSpacing.md) {
              Image(systemName: "bubble.left")
                  .font(.system(size: 48))
                  .foregroundColor(.secondary)
              
              Text("还没有评论")
                  .font(AppTypography.headline)
                  .foregroundColor(.secondary)
              
              Text("成为第一个评论的人")
                  .font(AppTypography.body)
                  .foregroundColor(.secondary)
          }
          .frame(maxWidth: .infinity, minHeight: 200)
      }
      
      private func replyIndicator(_ comment: Comment) -> some View {
          HStack {
              VStack(alignment: .leading, spacing: 2) {
                  Text("回复 @\(comment.user.username)")
                      .font(AppTypography.caption)
                      .fontWeight(.medium)
                      .foregroundColor(AppColors.primary)
                  
                  Text(comment.content)
                      .font(AppTypography.caption)
                      .foregroundColor(.secondary)
                      .lineLimit(2)
              }
              
              Spacer()
              
              Button(action: { replyingTo = nil }) {
                  Image(systemName: "xmark.circle.fill")
                      .foregroundColor(.secondary)
              }
          }
          .padding(AppSpacing.sm)
          .background(AppColors.primary.opacity(0.1))
          .cornerRadius(AppSpacing.sm)
      }
      
      private var commentActionSheet: ActionSheet {
          ActionSheet(
              title: Text("评论操作"),
              buttons: actionSheetButtons
          )
      }
      
      private var actionSheetButtons: [ActionSheet.Button] {
          var buttons: [ActionSheet.Button] = []
          
          if let comment = selectedComment {
              if comment.canEdit {
                  buttons.append(.default(Text("编辑")) {
                      editComment(comment)
                  })
              }
              
              if comment.canDelete {
                  buttons.append(.destructive(Text("删除")) {
                      deleteComment(comment)
                  })
              }
              
              buttons.append(.default(Text("举报")) {
                  reportComment(comment)
              })
          }
          
          buttons.append(.cancel())
          return buttons
      }
      
      private func submitComment() {
          let content = newCommentText.trimmingCharacters(in: .whitespacesAndNewlines)
          guard !content.isEmpty else { return }
          
          Task {
              do {
                  let parentId = replyingTo?.id
                  try await commentManager.addComment(
                      promptId: promptId,
                      content: content,
                      parentId: parentId
                  )
                  
                  // 清空输入框和回复状态
                  newCommentText = ""
                  replyingTo = nil
              } catch {
                  // 处理错误
              }
          }
      }
      
      private func editComment(_ comment: Comment) {
          // 实现编辑评论逻辑
      }
      
      private func deleteComment(_ comment: Comment) {
          Task {
              do {
                  try await commentManager.deleteComment(comment.id)
              } catch {
                  // 处理删除错误
              }
          }
      }
      
      private func reportComment(_ comment: Comment) {
          // 实现举报评论逻辑
      }
  }
  ```

---

## ⚡ 阶段 6: 主应用集成和导航

### 🏠 主界面架构
- [ ] **T034**: 创建 MainTabView.swift
  ```swift
  struct MainTabView: View {
      @State private var selectedTab: MainTab = .discover
      @StateObject private var authManager = AuthenticationManager()
      
      enum MainTab: String, CaseIterable {
          case discover = "discover"
          case myPrompts = "my_prompts"
          case teams = "teams"
          case templates = "templates"
          case settings = "settings"
          
          var displayName: String {
              switch self {
              case .discover: return "发现"
              case .myPrompts: return "我的"
              case .teams: return "团队"
              case .templates: return "模板"
              case .settings: return "设置"
              }
          }
          
          var icon: String {
              switch self {
              case .discover: return "magnifyingglass"
              case .myPrompts: return "doc.text"
              case .teams: return "person.2"
              case .templates: return "square.grid.2x2"
              case .settings: return "gear"
              }
          }
          
          var selectedIcon: String {
              switch self {
              case .discover: return "magnifyingglass.circle.fill"
              case .myPrompts: return "doc.text.fill"
              case .teams: return "person.2.fill"
              case .templates: return "square.grid.2x2.fill"
              case .settings: return "gear.circle.fill"
              }
          }
      }
      
      var body: some View {
          TabView(selection: $selectedTab) {
              // 发现页面
              DiscoverView()
                  .tabItem {
                      Image(systemName: selectedTab == .discover ? MainTab.discover.selectedIcon : MainTab.discover.icon)
                      Text(MainTab.discover.displayName)
                  }
                  .tag(MainTab.discover)
              
              // 我的提示词
              NavigationView {
                  PromptListView()
              }
              .tabItem {
                  Image(systemName: selectedTab == .myPrompts ? MainTab.myPrompts.selectedIcon : MainTab.myPrompts.icon)
                  Text(MainTab.myPrompts.displayName)
              }
              .tag(MainTab.myPrompts)
              
              // 团队
              TeamListView()
                  .tabItem {
                      Image(systemName: selectedTab == .teams ? MainTab.teams.selectedIcon : MainTab.teams.icon)
                      Text(MainTab.teams.displayName)
                  }
                  .tag(MainTab.teams)
              
              // 模板库
              TemplateLibraryView()
                  .tabItem {
                      Image(systemName: selectedTab == .templates ? MainTab.templates.selectedIcon : MainTab.templates.icon)
                      Text(MainTab.templates.displayName)
                  }
                  .tag(MainTab.templates)
              
              // 设置
              SettingsView()
                  .tabItem {
                      Image(systemName: selectedTab == .settings ? MainTab.settings.selectedIcon : MainTab.settings.icon)
                      Text(MainTab.settings.displayName)
                  }
                  .tag(MainTab.settings)
          }
          .accentColor(AppColors.primary)
          .environmentObject(authManager)
      }
  }
  ```

- [ ] **T035**: 创建 DiscoverView.swift
  ```swift
  struct DiscoverView: View {
      @State private var searchText = ""
      @State private var selectedCategory: String?
      @State private var publicPrompts: [Prompt] = []
      @State private var featuredPrompts: [Prompt] = []
      @State private var isLoading = false
      @State private var showingSearch = false
      
      let categories = ["网站开发", "内容创作", "数据分析", "教育培训", "商业策划", "代码生成"]
      
      var body: some View {
          NavigationView {
              ScrollView {
                  VStack(alignment: .leading, spacing: AppSpacing.lg) {
                      // 搜索栏
                      searchSection
                      
                      // 分类快速筛选
                      categoriesSection
                      
                      // 精选提示词
                      if !featuredPrompts.isEmpty {
                          featuredSection
                      }
                      
                      // 公开提示词列表
                      publicPromptsSection
                  }
                  .padding(AppSpacing.md)
              }
              .navigationTitle("发现")
              .refreshable {
                  await loadData()
              }
              .searchable(text: $searchText, isPresented: $showingSearch)
              .onChange(of: searchText) { _, newValue in
                  performSearch(newValue)
              }
          }
          .task {
              await loadData()
          }
      }
      
      private var searchSection: some View {
          Button(action: { showingSearch = true }) {
              HStack {
                  Image(systemName: "magnifyingglass")
                      .foregroundColor(.secondary)
                  
                  Text("搜索提示词...")
                      .foregroundColor(.secondary)
                  
                  Spacer()
              }
              .padding(AppSpacing.md)
              .background(AppColors.secondaryBackground)
              .cornerRadius(AppSpacing.cornerRadius)
          }
      }
      
      private var categoriesSection: some View {
          VStack(alignment: .leading, spacing: AppSpacing.sm) {
              Text("热门分类")
                  .font(AppTypography.headline)
                  .fontWeight(.semibold)
              
              ScrollView(.horizontal, showsIndicators: false) {
                  HStack(spacing: AppSpacing.sm) {
                      ForEach(categories, id: \.self) { category in
                          CategoryChip(
                              category: category,
                              isSelected: selectedCategory == category
                          ) {
                              if selectedCategory == category {
                                  selectedCategory = nil
                              } else {
                                  selectedCategory = category
                              }
                              Task {
                                  await loadPublicPrompts()
                              }
                          }
                      }
                  }
                  .padding(.horizontal, AppSpacing.md)
              }
          }
      }
      
      private var featuredSection: some View {
          VStack(alignment: .leading, spacing: AppSpacing.sm) {
              Text("精选推荐")
                  .font(AppTypography.headline)
                  .fontWeight(.semibold)
              
              ScrollView(.horizontal, showsIndicators: false) {
                  HStack(spacing: AppSpacing.md) {
                      ForEach(featuredPrompts) { prompt in
                          NavigationLink(destination: PromptDetailView(promptId: prompt.id)) {
                              FeaturedPromptCard(prompt: prompt)
                          }
                          .buttonStyle(.plain)
                      }
                  }
                  .padding(.horizontal, AppSpacing.md)
              }
          }
      }
      
      private var publicPromptsSection: some View {
          VStack(alignment: .leading, spacing: AppSpacing.sm) {
              HStack {
                  Text(selectedCategory ?? "公开提示词")
                      .font(AppTypography.headline)
                      .fontWeight(.semibold)
                  
                  Spacer()
                  
                  if selectedCategory != nil {
                      Button("清除筛选") {
                          selectedCategory = nil
                          Task {
                              await loadPublicPrompts()
                          }
                      }
                      .font(AppTypography.caption)
                      .foregroundColor(AppColors.primary)
                  }
              }
              
              if isLoading {
                  loadingView
              } else {
                  LazyVStack(spacing: AppSpacing.md) {
                      ForEach(publicPrompts) { prompt in
                          NavigationLink(destination: PromptDetailView(promptId: prompt.id)) {
                              PromptRowView(
                                  prompt: prompt,
                                  onFavorite: { },
                                  onShare: { },
                                  onDelete: { }
                              )
                          }
                          .buttonStyle(.plain)
                      }
                  }
              }
          }
      }
      
      private var loadingView: some View {
          VStack(spacing: AppSpacing.md) {
              ProgressView()
              Text("加载中...")
                  .foregroundColor(.secondary)
          }
          .frame(maxWidth: .infinity, minHeight: 100)
      }
      
      private func loadData() async {
          await withTaskGroup(of: Void.self) { group in
              group.addTask {
                  await loadFeaturedPrompts()
              }
              group.addTask {
                  await loadPublicPrompts()
              }
          }
      }
      
      private func loadFeaturedPrompts() async {
          // 加载精选提示词
          do {
              let response = try await APIClient.shared.request(
                  endpoint: .getPrompts(category: nil, isTemplate: true),
                  responseType: PromptsResponse.self
              )
              await MainActor.run {
                  self.featuredPrompts = Array(response.data.prefix(5))
              }
          } catch {
              // 处理错误
          }
      }
      
      private func loadPublicPrompts() async {
          isLoading = true
          
          do {
              let response = try await APIClient.shared.request(
                  endpoint: .getPrompts(category: selectedCategory, isTemplate: nil),
                  responseType: PromptsResponse.self
              )
              await MainActor.run {
                  self.publicPrompts = response.data
                  self.isLoading = false
              }
          } catch {
              await MainActor.run {
                  self.isLoading = false
              }
          }
      }
      
      private func performSearch(_ query: String) {
          // 实现搜索逻辑
          Task {
              if query.isEmpty {
                  await loadPublicPrompts()
              } else {
                  // 执行搜索API调用
              }
          }
      }
  }
  ```

- [ ] **T036**: 创建 SettingsView.swift
  ```swift
  struct SettingsView: View {
      @StateObject private var authManager = AuthenticationManager()
      @StateObject private var biometricManager = BiometricManager()
      @State private var showingLogoutAlert = false
      @State private var showingAccountDeletion = false
      
      var body: some View {
          NavigationView {
              List {
                  // 用户信息部分
                  userProfileSection
                  
                  // 应用设置部分
                  appSettingsSection
                  
                  // 安全设置部分
                  securitySection
                  
                  // 数据和隐私部分
                  dataPrivacySection
                  
                  // 关于应用部分
                  aboutSection
                  
                  // 账户操作部分
                  accountActionsSection
              }
              .navigationTitle("设置")
          }
          .alert("确认登出", isPresented: $showingLogoutAlert) {
              Button("登出", role: .destructive) {
                  authManager.logout()
              }
              Button("取消", role: .cancel) { }
          } message: {
              Text("登出后需要重新输入账号密码才能使用应用")
          }
          .sheet(isPresented: $showingAccountDeletion) {
              AccountDeletionView()
          }
      }
      
      private var userProfileSection: some View {
          Section {
              if let user = authManager.user {
                  HStack {
                      // 用户头像
                      Circle()
                          .fill(AppColors.primary.gradient)
                          .frame(width: 60, height: 60)
                          .overlay {
                              Text(String(user.username.prefix(1)).uppercased())
                                  .font(.system(size: 24, weight: .bold))
                                  .foregroundColor(.white)
                          }
                      
                      VStack(alignment: .leading, spacing: 4) {
                          Text(user.username)
                              .font(AppTypography.headline)
                              .fontWeight(.semibold)
                          
                          Text(user.email)
                              .font(AppTypography.body)
                              .foregroundColor(.secondary)
                          
                          Text("加入于 \(user.createdAt.formatted(date: .abbreviated, time: .omitted))")
                              .font(AppTypography.caption)
                              .foregroundColor(.secondary)
                      }
                      
                      Spacer()
                      
                      Button("编辑") {
                          // 编辑用户资料
                      }
                      .buttonStyle(.bordered)
                  }
                  .padding(.vertical, AppSpacing.sm)
              }
          }
      }
      
      private var appSettingsSection: some View {
          Section("应用设置") {
              NavigationLink(destination: AppearanceSettingsView()) {
                  SettingsRow(
                      icon: "paintbrush",
                      title: "外观",
                      detail: "深色模式、主题色彩"
                  )
              }
              
              NavigationLink(destination: NotificationSettingsView()) {
                  SettingsRow(
                      icon: "bell",
                      title: "通知",
                      detail: "推送通知设置"
                  )
              }
              
              NavigationLink(destination: LanguageSettingsView()) {
                  SettingsRow(
                      icon: "globe",
                      title: "语言",
                      detail: "界面语言设置"
                  )
              }
              
              NavigationLink(destination: EditorSettingsView()) {
                  SettingsRow(
                      icon: "doc.text",
                      title: "编辑器",
                      detail: "字体、主题、快捷键"
                  )
              }
          }
      }
      
      private var securitySection: some View {
          Section("安全与隐私") {
              if biometricManager.isAvailable {
                  HStack {
                      SettingsRow(
                          icon: biometricManager.biometryType == .faceID ? "faceid" : "touchid",
                          title: biometricManager.biometryType == .faceID ? "Face ID" : "Touch ID",
                          detail: "快速安全登录"
                      )
                      
                      Spacer()
                      
                      Toggle("", isOn: .constant(biometricManager.isBiometryEnabled()))
                  }
              }
              
              NavigationLink(destination: PasswordChangeView()) {
                  SettingsRow(
                      icon: "key",
                      title: "修改密码",
                      detail: "更改登录密码"
                  )
              }
              
              NavigationLink(destination: SessionManagementView()) {
                  SettingsRow(
                      icon: "desktopcomputer",
                      title: "设备管理",
                      detail: "管理登录设备"
                  )
              }
          }
      }
      
      private var dataPrivacySection: some View {
          Section("数据与隐私") {
              NavigationLink(destination: DataSyncSettingsView()) {
                  SettingsRow(
                      icon: "icloud",
                      title: "数据同步",
                      detail: "云端同步设置"
                  )
              }
              
              NavigationLink(destination: StorageManagementView()) {
                  SettingsRow(
                      icon: "internaldrive",
                      title: "存储管理",
                      detail: "本地数据管理"
                  )
              }
              
              NavigationLink(destination: PrivacyPolicyView()) {
                  SettingsRow(
                      icon: "hand.raised",
                      title: "隐私政策",
                      detail: "查看隐私条款"
                  )
              }
              
              NavigationLink(destination: DataExportView()) {
                  SettingsRow(
                      icon: "square.and.arrow.up",
                      title: "导出数据",
                      detail: "导出个人数据"
                  )
              }
          }
      }
      
      private var aboutSection: some View {
          Section("关于") {
              NavigationLink(destination: AboutView()) {
                  SettingsRow(
                      icon: "info.circle",
                      title: "关于 PromptFlow",
                      detail: "版本信息和团队"
                  )
              }
              
              NavigationLink(destination: HelpCenterView()) {
                  SettingsRow(
                      icon: "questionmark.circle",
                      title: "帮助中心",
                      detail: "使用指南和FAQ"
                  )
              }
              
              NavigationLink(destination: FeedbackView()) {
                  SettingsRow(
                      icon: "envelope",
                      title: "意见反馈",
                      detail: "提交建议和问题"
                  )
              }
              
              Button(action: rateApp) {
                  SettingsRow(
                      icon: "star",
                      title: "评价应用",
                      detail: "在 App Store 中评价"
                  )
              }
              .foregroundColor(.primary)
          }
      }
      
      private var accountActionsSection: some View {
          Section {
              Button(action: { showingLogoutAlert = true }) {
                  HStack {
                      Image(systemName: "rectangle.portrait.and.arrow.right")
                          .foregroundColor(.red)
                      Text("登出")
                          .foregroundColor(.red)
                      Spacer()
                  }
              }
              
              Button(action: { showingAccountDeletion = true }) {
                  HStack {
                      Image(systemName: "trash")
                          .foregroundColor(.red)
                      Text("删除账户")
                          .foregroundColor(.red)
                      Spacer()
                  }
              }
          }
      }
      
      private func rateApp() {
          // 跳转到 App Store 评价页面
          if let url = URL(string: "https://apps.apple.com/app/id\(Bundle.main.appStoreID)") {
              UIApplication.shared.open(url)
          }
      }
  }
  
  struct SettingsRow: View {
      let icon: String
      let title: String
      let detail: String
      
      var body: some View {
          HStack {
              Image(systemName: icon)
                  .foregroundColor(AppColors.primary)
                  .frame(width: 24, height: 24)
              
              VStack(alignment: .leading, spacing: 2) {
                  Text(title)
                      .font(AppTypography.body)
                  
                  Text(detail)
                      .font(AppTypography.caption)
                      .foregroundColor(.secondary)
              }
              
              Spacer()
          }
      }
  }
  ```

### 🎨 UI 组件库完善
- [ ] **T037**: 创建通用 UI 组件
  ```swift
  // CircularProgressView.swift
  struct CircularProgressView: View {
      let progress: Double
      let score: Int
      
      var body: some View {
          ZStack {
              Circle()
                  .stroke(AppColors.primary.opacity(0.2), lineWidth: 8)
              
              Circle()
                  .trim(from: 0, to: progress)
                  .stroke(
                      AngularGradient(
                          gradient: Gradient(colors: [AppColors.primary, AppColors.accent]),
                          center: .center
                      ),
                      style: StrokeStyle(lineWidth: 8, lineCap: .round)
                  )
                  .rotationEffect(.degrees(-90))
                  .animation(.easeInOut(duration: 1.0), value: progress)
              
              Text("\(score)")
                  .font(.system(size: 24, weight: .bold))
                  .foregroundColor(AppColors.primary)
          }
      }
  }
  
  // CodeEditorView.swift
  struct CodeEditorView: View {
      @Binding var content: String
      let language: Language
      let theme: Theme
      
      enum Language {
          case prompt
          case swift
          case javascript
          case python
      }
      
      enum Theme {
          case xcode
          case dark
          case light
      }
      
      var body: some View {
          ScrollView([.horizontal, .vertical]) {
              HStack(alignment: .top, spacing: 0) {
                  // 行号
                  lineNumbers
                  
                  // 代码内容
                  TextEditor(text: $content)
                      .font(AppTypography.codeFont)
                      .scrollDisabled(true)
              }
          }
          .background(backgroundColor)
          .cornerRadius(AppSpacing.cornerRadius)
      }
      
      private var lineNumbers: some View {
          VStack(alignment: .trailing, spacing: 0) {
              ForEach(1...max(content.components(separatedBy: .newlines).count, 1), id: \.self) { line in
                  Text("\(line)")
                      .font(AppTypography.codeFont.monospacedDigit())
                      .foregroundColor(.secondary)
                      .frame(minWidth: 30)
              }
              Spacer()
          }
          .padding(.leading, AppSpacing.sm)
          .padding(.trailing, AppSpacing.xs)
          .background(Color.secondary.opacity(0.1))
      }
      
      private var backgroundColor: Color {
          switch theme {
          case .xcode, .light:
              return Color(.systemBackground)
          case .dark:
              return Color(.systemGray6)
          }
      }
  }
  
  // FlowLayout.swift
  struct FlowLayout: Layout {
      let spacing: CGFloat
      
      init(spacing: CGFloat = 8) {
          self.spacing = spacing
      }
      
      func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
          let sizes = subviews.map { $0.sizeThatFits(.unspecified) }
          return layout(sizes: sizes, proposal: proposal).size
      }
      
      func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
          let sizes = subviews.map { $0.sizeThatFits(.unspecified) }
          let offsets = layout(sizes: sizes, proposal: proposal).offsets
          
          for (offset, subview) in zip(offsets, subviews) {
              subview.place(at: CGPoint(x: bounds.minX + offset.x, y: bounds.minY + offset.y), proposal: .unspecified)
          }
      }
      
      private func layout(sizes: [CGSize], proposal: ProposedViewSize) -> (offsets: [CGPoint], size: CGSize) {
          let width = proposal.width ?? .infinity
          var result: [CGPoint] = []
          var currentPosition = CGPoint.zero
          var lineHeight: CGFloat = 0
          var maxX: CGFloat = 0
          
          for size in sizes {
              if currentPosition.x + size.width > width && !result.isEmpty {
                  // 换行
                  currentPosition.x = 0
                  currentPosition.y += lineHeight + spacing
                  lineHeight = 0
              }
              
              result.append(currentPosition)
              
              currentPosition.x += size.width + spacing
              lineHeight = max(lineHeight, size.height)
              maxX = max(maxX, currentPosition.x - spacing)
          }
          
          return (result, CGSize(width: maxX, height: currentPosition.y + lineHeight))
      }
  }
  
  // CategoryChip.swift
  struct CategoryChip: View {
      let category: String
      let isSelected: Bool
      let action: () -> Void
      
      var body: some View {
          Button(action: action) {
              Text(category)
                  .font(AppTypography.caption)
                  .fontWeight(.medium)
                  .padding(.horizontal, AppSpacing.md)
                  .padding(.vertical, AppSpacing.sm)
                  .background(
                      isSelected ? AppColors.primary : AppColors.secondaryBackground
                  )
                  .foregroundColor(
                      isSelected ? .white : .primary
                  )
                  .cornerRadius(20)
          }
          .buttonStyle(.plain)
      }
  }
  ```

---

## 🚀 阶段 7: 测试和发布准备

### 🧪 测试实现
- [ ] **T038**: 创建单元测试
  ```swift
  // PromptListViewModelTests.swift
  import XCTest
  @testable import PromptFlowIOS
  
  final class PromptListViewModelTests: XCTestCase {
      
      var viewModel: PromptListViewModel!
      var mockAPIClient: MockAPIClient!
      
      override func setUp() {
          super.setUp()
          mockAPIClient = MockAPIClient()
          viewModel = PromptListViewModel()
          // 注入 mock 客户端
      }
      
      override func tearDown() {
          viewModel = nil
          mockAPIClient = nil
          super.tearDown()
      }
      
      func testLoadPrompts_Success() async throws {
          // Given
          let expectedPrompts = [
              Prompt.mock(id: 1, title: "Test Prompt 1"),
              Prompt.mock(id: 2, title: "Test Prompt 2")
          ]
          mockAPIClient.mockPromptsResponse = expectedPrompts
          
          // When
          await viewModel.loadPrompts()
          
          // Then
          XCTAssertEqual(viewModel.prompts.count, 2)
          XCTAssertEqual(viewModel.prompts[0].title, "Test Prompt 1")
          XCTAssertFalse(viewModel.isLoading)
          XCTAssertNil(viewModel.error)
      }
      
      func testLoadPrompts_NetworkError() async throws {
          // Given
          mockAPIClient.shouldReturnError = true
          mockAPIClient.mockError = NetworkError.networkUnavailable
          
          // When
          await viewModel.loadPrompts()
          
          // Then
          XCTAssertTrue(viewModel.prompts.isEmpty)
          XCTAssertFalse(viewModel.isLoading)
          XCTAssertNotNil(viewModel.error)
      }
      
      func testSearchPrompts() async throws {
          // Given
          let allPrompts = [
              Prompt.mock(id: 1, title: "Swift Programming"),
              Prompt.mock(id: 2, title: "Python Tutorial"),
              Prompt.mock(id: 3, title: "Swift UI Design")
          ]
          mockAPIClient.mockPromptsResponse = allPrompts
          await viewModel.loadPrompts()
          
          // When
          viewModel.searchText = "Swift"
          
          // Then
          XCTAssertEqual(viewModel.filteredPrompts.count, 2)
          XCTAssertTrue(viewModel.filteredPrompts.allSatisfy { $0.title.contains("Swift") })
      }
  }
  
  // AuthenticationManagerTests.swift
  final class AuthenticationManagerTests: XCTestCase {
      
      var authManager: AuthenticationManager!
      var mockAPIClient: MockAPIClient!
      var mockKeychainManager: MockKeychainManager!
      
      override func setUp() {
          super.setUp()
          mockAPIClient = MockAPIClient()
          mockKeychainManager = MockKeychainManager()
          authManager = AuthenticationManager()
      }
      
      func testLogin_Success() async throws {
          // Given
          let expectedUser = User.mock(id: 1, username: "testuser", email: "test@example.com")
          let expectedToken = "mock_token_123"
          mockAPIClient.mockLoginResponse = LoginResponse(user: expectedUser, token: expectedToken)
          
          // When
          try await authManager.login(email: "test@example.com", password: "password123")
          
          // Then
          XCTAssertEqual(authManager.user?.id, expectedUser.id)
          XCTAssertEqual(authManager.authToken, expectedToken)
          XCTAssertTrue(authManager.isAuthenticated)
          XCTAssertNil(authManager.error)
      }
      
      func testLogin_InvalidCredentials() async throws {
          // Given
          mockAPIClient.shouldReturnError = true
          mockAPIClient.mockError = NetworkError.unauthorized
          
          // When
          do {
              try await authManager.login(email: "test@example.com", password: "wrongpassword")
              XCTFail("Expected error to be thrown")
          } catch {
              // Then
              XCTAssertNil(authManager.user)
              XCTAssertNil(authManager.authToken)
              XCTAssertFalse(authManager.isAuthenticated)
              XCTAssertTrue(error is NetworkError)
          }
      }
  }
  ```

- [ ] **T039**: 创建 UI 测试
  ```swift
  // PromptFlowIOSUITests.swift
  import XCUITest
  
  final class PromptFlowIOSUITests: XCTestCase {
      
      var app: XCUIApplication!
      
      override func setUp() {
          super.setUp()
          app = XCUIApplication()
          app.launchArguments.append("--uitesting")
          app.launch()
      }
      
      func testLoginFlow() throws {
          // 检查登录界面元素
          XCTAssertTrue(app.textFields["邮箱"].exists)
          XCTAssertTrue(app.secureTextFields["密码"].exists)
          XCTAssertTrue(app.buttons["登录"].exists)
          
          // 输入登录信息
          app.textFields["邮箱"].tap()
          app.textFields["邮箱"].typeText("test@example.com")
          
          app.secureTextFields["密码"].tap()
          app.secureTextFields["密码"].typeText("password123")
          
          // 点击登录
          app.buttons["登录"].tap()
          
          // 验证登录成功后的界面
          XCTAssertTrue(app.tabBars["Main Tab Bar"].waitForExistence(timeout: 5))
          XCTAssertTrue(app.buttons["发现"].exists)
          XCTAssertTrue(app.buttons["我的"].exists)
      }
      
      func testCreatePrompt() throws {
          // 先登录
          loginUser()
          
          // 导航到我的提示词
          app.tabBars.buttons["我的"].tap()
          
          // 点击创建按钮
          app.navigationBars.buttons["添加"].tap()
          
          // 填写提示词信息
          let titleField = app.textFields["标题"]
          titleField.tap()
          titleField.typeText("测试提示词")
          
          let contentTextView = app.textViews["内容"]
          contentTextView.tap()
          contentTextView.typeText("这是一个测试提示词的内容")
          
          // 保存提示词
          app.navigationBars.buttons["保存"].tap()
          
          // 验证创建成功
          XCTAssertTrue(app.staticTexts["测试提示词"].waitForExistence(timeout: 5))
      }
      
      func testSearchPrompts() throws {
          // 先登录
          loginUser()
          
          // 导航到发现页面
          app.tabBars.buttons["发现"].tap()
          
          // 使用搜索功能
          let searchField = app.searchFields["搜索提示词..."]
          searchField.tap()
          searchField.typeText("网站")
          
          // 验证搜索结果
          XCTAssertTrue(app.staticTexts["Website Generator"].waitForExistence(timeout: 3))
      }
      
      func testAIAnalysisFlow() throws {
          // 先登录
          loginUser()
          
          // 导航到我的提示词
          app.tabBars.buttons["我的"].tap()
          
          // 选择一个提示词
          app.staticTexts["My Test Prompt"].tap()
          
          // 切换到 AI 分析标签
          app.buttons["AI分析"].tap()
          
          // 等待分析完成
          XCTAssertTrue(app.staticTexts["质量评分"].waitForExistence(timeout: 10))
          
          // 验证分析结果显示
          XCTAssertTrue(app.staticTexts["优化建议"].exists)
          XCTAssertTrue(app.staticTexts["相似推荐"].exists)
          
          // 测试优化功能
          app.buttons["应用优化建议"].tap()
          XCTAssertTrue(app.alerts["优化完成"].waitForExistence(timeout: 5))
      }
      
      private func loginUser() {
          if app.textFields["邮箱"].exists {
              app.textFields["邮箱"].tap()
              app.textFields["邮箱"].typeText("test@example.com")
              
              app.secureTextFields["密码"].tap()
              app.secureTextFields["密码"].typeText("password123")
              
              app.buttons["登录"].tap()
              
              // 等待登录完成
              XCTAssertTrue(app.tabBars["Main Tab Bar"].waitForExistence(timeout: 5))
          }
      }
  }
  ```

### 📱 发布配置
- [ ] **T040**: 配置 App Store 发布资源
  ```swift
  // Bundle+Extensions.swift
  extension Bundle {
      var appVersion: String {
          return infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
      }
      
      var buildVersion: String {
          return infoDictionary?["CFBundleVersion"] as? String ?? "1"
      }
      
      var appStoreID: String {
          return "YOUR_APP_STORE_ID"
      }
      
      var displayName: String {
          return infoDictionary?["CFBundleDisplayName"] as? String ?? "PromptFlow"
      }
  }
  
  // Info.plist 配置示例
  /*
  <?xml version="1.0" encoding="UTF-8"?>
  <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
  <plist version="1.0">
  <dict>
      <key>CFBundleDisplayName</key>
      <string>PromptFlow</string>
      <key>CFBundleIdentifier</key>
      <string>com.promptflow.ios</string>
      <key>CFBundleShortVersionString</key>
      <string>1.0.0</string>
      <key>CFBundleVersion</key>
      <string>1</string>
      <key>LSRequiresIPhoneOS</key>
      <true/>
      <key>UILaunchScreen</key>
      <dict>
          <key>UIColorName</key>
          <string>LaunchScreenBackground</string>
      </dict>
      <key>UIRequiredDeviceCapabilities</key>
      <array>
          <string>armv7</string>
      </array>
      <key>UISupportedInterfaceOrientations</key>
      <array>
          <string>UIInterfaceOrientationPortrait</string>
          <string>UIInterfaceOrientationLandscapeLeft</string>
          <string>UIInterfaceOrientationLandscapeRight</string>
      </array>
      <key>NSAppTransportSecurity</key>
      <dict>
          <key>NSAllowsArbitraryLoads</key>
          <false/>
          <key>NSExceptionDomains</key>
          <dict>
              <key>localhost</key>
              <dict>
                  <key>NSExceptionAllowsInsecureHTTPLoads</key>
                  <true/>
              </dict>
          </dict>
      </dict>
  </dict>
  </plist>
  */
  ```

---

## 📝 Claude Code 开发指导原则

### 🤖 AI 开发说明
1. **逐步实现**: 每次选择 1-3 个相关任务完成，不要试图一次性实现整个应用
2. **依赖关系**: 按照任务编号顺序执行，确保基础功能先完成
3. **代码质量**: 每个实现都要包含错误处理、加载状态管理和用户体验优化
4. **测试覆盖**: 重要功能实现后要同步创建对应的测试用例
5. **文档更新**: 完成功能后要更新相关的 README 和 API 文档

### 📋 任务状态管理
- [ ] **未开始**: 任务尚未开始实现
- [🔄] **进行中**: 任务正在实现过程中
- [✅] **已完成**: 任务已经完成并通过测试
- [⚠️] **需要修复**: 任务实现有问题需要修复
- [🔍] **待测试**: 任务实现完成但需要测试验证

### 🎯 完成标准
每个任务完成时需要确保：
1. **功能完整**: 实现任务描述中的所有功能点
2. **错误处理**: 包含完善的错误处理和用户提示
3. **界面优化**: 符合 iOS 人机界面指南的设计标准
4. **性能优化**: 考虑内存使用、响应速度等性能因素
5. **代码规范**: 遵循 Swift 编码规范和项目架构标准

### 📊 进度跟踪
- **总任务数**: 40 个核心任务
- **预估工作量**: 每个任务 1-3 天工作量
- **里程碑检查**: 每完成一个阶段进行功能验收
- **质量保证**: 关键功能需要包含单元测试和 UI 测试

---

**📱 PromptFlow iOS - Claude Code 开发 TodoList**  
**版本**: 2.0.0  
**创建日期**: 2025-06-25  
**适用对象**: Claude Code AI 开发助手  
**任务总数**: 40 个详细开发任务  
**预估开发周期**: 8-12 周（AI 辅助开发）  

> 此 TodoList 专为 Claude Code 等 AI 开发助手设计，每个任务都包含具体的代码实现要求和验收标准。建议逐步完成，每次选择 1-3 个相关任务进行实现。