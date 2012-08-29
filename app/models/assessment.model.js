var model = require('./index');

module.exports = {
  name: 'Assessment',
  schema: require('./schema/assessment'),
  options: {
    plugins: ['id']  
  }
};
