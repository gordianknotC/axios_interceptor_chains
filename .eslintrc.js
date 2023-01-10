module.exports = {
    root: true,
    env: {
      node: true
    },
    "plugins": [
        "cross-import"
    ],
    extends: ["plugin:vue/essential", "eslint:recommended", "@vue/typescript/recommended", "@vue/prettier", "plugin:storybook/recommended"],
    parserOptions: {
      ecmaVersion: 2020
    },
    rules: {
      impliedStrict: true,
      "no-console": "off",
      "no-debugger": "off",
      // "no-console": import.meta.env.VITE_APP_ENV === "production" ? "warn" : "off",
      // "no-debugger": import.meta.env.VITE_APP_ENV === "production" ? "warn" : "off",
      "@typescript-eslint/ban-ts-ignore": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/ban-types": "off",
      "@typescript-eslint/no-use-before-define": "off",
      "@typescript-eslint/camelcase": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-extra-semi": "off",
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/interface-name-prefix": "off",
      "@typescript-eslint/triple-slash-reference": "off",
      "no-useless-catch": "off",
      "no-useless-escape": "off",
      "no-var": "warn",
      "no-param-reassign": "warn",
      "vue/no-multiple-template-root": "off",
      "import/named": "off",
      "import/newline-after-import": "off",
      "import/no-dynamic-require": "off",
      "import/no-named-as-default": "off",
      "import/no-named-as-default-member": "off",
      "import/no-webpack-loader-syntax": "off",
      "no-empty": "off",
      "vue/multi-word-component-names": "off",
      "vue/return-in-computed-property": "off",
      // "import/prefer-default-export": "off",
      // "import/no-duplicates": "off",
      // "import/no-mutable-exports": "off",
      quotes: ["warn", "double"],
      "prettier/prettier": "off",
      "prefer-const": "off"
    }
  };