const config = {
  database: './database/planning.sqlite' || process.env.PLANNING_DB_PATH,
  port: 8081,
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