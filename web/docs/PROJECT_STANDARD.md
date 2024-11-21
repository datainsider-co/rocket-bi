## Naming convention

- Variable use **camelCase** ex: `const isLogin = true;`
- Class name use **PascalCase** ex: `class LoginScreen {}`
- Enum use **PascalCase** ex: `enum ColumnType {}`
- Folder name use **kebab-case** ex: `di-core/chart-option`
- File \*.Vue
  - scss use **login-button** ex: `login-button.scss`
  - File .ts use **LoginScreen.ts**
  - File .vue **LoginScreen.vue**

### Import in di-core

- Interface or abstract in domain should has *fromObject* method and import from `~@core/`

```ts
import { BoolColumn } from '@core/common/domain/Model';

export abstract class Column {
  static fromObject(obj: any): Column | undefined {
    switch (obj.className) {
      case ColumnType.bool:
        return BoolColumn.fromObject(obj);
      default:
        Log.info(`fromObject: object with className ${obj.className} not found`, obj);
        return void 0;
    }
  }
}
```

- Với lớp implement: sử dụng import tuyệt đối với interface hoặc abstract

```ts
import { Column } from '@core/common/domain/Model/Column/Column';

export class BoolColumn extends Column {
  static fromObject(obj: BoolColumn): BoolColumn {
    const defaultExpression = obj.defaultExpression ? Expression.fromObject(obj.defaultExpression) : void 0;
    return new BoolColumn(obj.name, obj.displayName, obj.isNullable, obj.description, obj.defaultValue, defaultExpression);
  }
}
```

- Nếu bị lỗi import thì sử dụng import càng gần với file đó nhất. Ví dụ file QuerySetting.ts
  - Dùng `@core/common/domain/Modal` hơn là dùng `@core/common/domain`

### File index trong di-core

- Không được define bất cứ method, function, class nào trong install.ts
- Sử dụng `yarn create:index [path]` để tạo thư mục index

```sh
# tạo file index cho di-core/domain và sub folder
yarn create:index di-core/domain
```

- Khi sử dụng core thì chỉ cần `import { /// } from '@core/common/domain'`;

### Quy chuẩn đặt tên tests

- File test phải có đuôi là `[Name]Test.ts` ex: `CookieTest.ts`
- Test services sẽ đặt trong file servies, tương tự với respository và utils
- Nếu test của từng submodule sẽ phải đưa vào trong module đó. Ví dụ test **Login** của module **Authentication** thì
  folder sẽ là `di-core/Authentication/Services/LoginTest.ts`
- **describe** trong test sẽ diễn tả là test 1 feature lớn ví dụ `Test Cookie Manager`
- **it** diễn tả một case sẽ diễn ra ví dụ `should remove value in cookie successful`
