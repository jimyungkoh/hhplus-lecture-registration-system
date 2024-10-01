module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    // 인터페이스 이름 접두사 규칙을 비활성화합니다. 이는 코드 스타일의 유연성을 위해 선택되었습니다.
    '@typescript-eslint/interface-name-prefix': 'off',
    // 함수 반환 타입을 명시적으로 지정하는 규칙을 비활성화합니다. 이는 타입 추론을 활용하고 코드를 간결하게 유지하기 위함입니다.
    '@typescript-eslint/explicit-function-return-type': 'off',
    // 모듈 경계에서 타입을 명시적으로 지정하는 규칙을 비활성화합니다. 이는 불필요한 타입 선언을 줄이기 위해 선택되었습니다.
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    // 'any' 타입 사용을 금지합니다. 이는 타입 안정성을 향상시키기 위해 'off'에서 'error'로 변경되었습니다.
    '@typescript-eslint/no-explicit-any': 'error',
  },
};
