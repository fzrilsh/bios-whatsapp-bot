import "dotenv/config"
import generalConfig from "./general.config.js"
import ownerConfig from "./owner.config.js"
import apiConfig from "./api.config.js"

export default Object.freeze({
    ...generalConfig,
    ...ownerConfig,
    ...apiConfig
})