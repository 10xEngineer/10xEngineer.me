var model = require('./index');

module.exports = {
  name: 'Test',
  schema: require('./schema/test'),
  options: {
    plugins: ['id']  
  }
};
