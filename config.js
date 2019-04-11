const config = {
  database:  process.env.PLANNING_DB_PATH || './database/planning.sqlite',
  port: 8081,
  walMode: false,
  corsOrigin: [
    'http://localhost:8080',
    'https://localhost:8080',
    'http://plan.lamusiquedelagarde.be',
    'https://plan.lamusiquedelagarde.be',
    'http://plan.independance-musicale.be',
    'https://plan.independance-musicale.be'
  ]
};

module.exports = config;