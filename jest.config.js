module.exports = {
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverageFrom: ['**/*.ts', '!**/node_modules/**', '!**/vendor/**', '!**/{data,cli}.ts']
};
