module.exports = Object.freeze({
    // https://stackoverflow.com/questions/29307768/using-regex-to-match-date-format-in-yyyymmdd
    DATE_REGEX: /(?<!\d)(?:(?:20\d{2})(?:(?:(?:0[13578]|1[02])31)|(?:(?:0[1,3-9]|1[0-2])(?:29|30)))|(?:(?:20(?:0[48]|[2468][048]|[13579][26]))0229)|(?:20\d{2})(?:(?:0?[1-9])|(?:1[0-2]))(?:0?[1-9]|1\d|2[0-8]))(?!\d)/
});