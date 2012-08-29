var model = require('./index');

module.exports = {
  name: 'Quiz',
  schema: require('./schema/quiz'),
  options: {
    plugins: ['id']  
  }
};
