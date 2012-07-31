var model = require('./index');

module.exports = {
  name: 'Question',
  schema: require('./schema/question'),
  options: {
    plugins: ['id']  
  }
};
