module.exports = {
    testEnvironment: 'jsdom',
    setupFiles: ['jest-canvas-mock', '<rootDir>/tests/mocks/phaserMock.js'],
    transform: {
        '^.+\\.js$': 'babel-jest',
    },
    moduleNameMapper: {
        '^phaser$': '<rootDir>/tests/mocks/phaserMock.js',
        '\\.(css|less|scss|sass)$': '<rootDir>/tests/mocks/styleMock.js',
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
            '<rootDir>/tests/mocks/fileMock.js',
    },
    testMatch: ['**/tests/**/*.test.js'],
    verbose: true,
};
