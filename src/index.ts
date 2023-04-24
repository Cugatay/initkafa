import inquirer from 'inquirer';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import jsBeautify from 'js-beautify';

const prompt = inquirer.createPromptModule();

const currentPath = process.cwd();
const tsconfigPath = path.join(currentPath, 'tsconfig.json');
const eslintPath = path.join(currentPath, 'eslintrc.json');
const prettierPath = path.join(currentPath, '.prettierrc.json');
const packageJsonPath = path.join(currentPath, 'package.json');

function getConfig(path: string) {
  return JSON.parse(fs.readFileSync(path).toString());
}

function writeConfig(path: string, config: string) {
  fs.writeFileSync(path, jsBeautify.js_beautify(JSON.stringify(config)));
}

type Configs = 'TSConfig' | 'ESLint' | 'Prettier';

interface IAnswers {
  selections: Configs[];
  usingReact: boolean;
  usingVitest: boolean;
}

(async () => {
  const { selections, usingReact, usingVitest }: IAnswers = await prompt([
    {
      type: 'checkbox',
      name: 'selections',
      message: `Which Files You Want to Setup Using ${chalk.yellow('Kodkafa Settings')}?`,
      choices: [
        { name: 'TSConfig', checked: true },
        { name: 'ESLint', checked: true },
        { name: 'Prettier', checked: true },
      ],
    },
    {
      type: 'confirm',
      name: 'usingReact',
      message: 'Do You Use React?',
    },
    {
      type: 'confirm',
      name: 'usingVitest',
      message: 'Do You Use Vitest in Vite for testing?',
    },
  ]);

  if (!selections.length) {
    console.log(chalk.red('In order to create a config file, you must choose one!'));
    return;
  }

  const initTSConfig = !!selections.find((config) => config === 'TSConfig');
  const initEslint = !!selections.find((config) => config === 'ESLint');
  const initPrettier = !!selections.find((config) => config === 'Prettier');

  const configs = {
    tsconfig: getConfig(`configs/tsconfig-${usingReact ? 'react' : 'node'}.json`),
    eslint: getConfig(`configs/eslint-${usingReact ? 'react' : 'node'}.json`),
    prettier: getConfig(`configs/prettierrc.json`),
    packageJson: getConfig(packageJsonPath),
  };

  if (initTSConfig) {
    if (usingVitest) {
      configs.tsconfig.compilerOptions.types = ['vitest/globals'];
      configs.packageJson.devDependencies['vitest'] = '^0.29.2';
    }
    writeConfig(tsconfigPath, configs.tsconfig);
  }

  if (initEslint || initPrettier) {
    if (!configs.packageJson.devDependencies) {
      configs.packageJson.devDependencies = {};
    }

    configs.packageJson.devDependencies['@kodkafa/eslint-config'] = '^1.0.1';
  }

  if (initEslint && initPrettier) {
    configs.packageJson.devDependencies = {
      ...configs.packageJson.devDependencies,
      'eslint-config-prettier': '^8.7.0',
      'eslint-plugin-prettier': '^4.2.1',
    };

    configs.eslint.extends.push('plugin:prettier/recommended');
    configs.eslint.plugins.push('prettier');
    configs.eslint.rules['prettier/prettier'] = ['error', configs.prettier];
  }

  if (initEslint) {
    configs.packageJson.devDependencies = {
      ...configs.packageJson.devDependencies,
      '@typescript-eslint/eslint-plugin': '^5.54.1',
      '@typescript-eslint/parser': '^5.54.1',
      eslint: '^8.35.0',
    };

    if (usingReact) {
      configs.packageJson.devDependencies['eslint-plugin-react'] = '^7.32.2';
    }

    writeConfig(eslintPath, configs.eslint);
  }

  if (initPrettier) {
    configs.packageJson.devDependencies['prettier'] = '^2.8.4';
    writeConfig(prettierPath, configs.prettier);
  }

  writeConfig(packageJsonPath, configs.packageJson);
})();
