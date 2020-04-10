const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RecipeSchema = new Schema({
	recipeName: {
		type: String,
		required: false
	},
	ingredientItems: {
		type: [String],
	},
	directionItems: {
		type: [String],
	},
	isCustom: {
		type: Boolean,
		default : false
	},
	totalNutrients: {
		type: Schema.Types.Mixed
	},
	totalDaily: {
		type: Schema.Types.Mixed
	},
	thirdPartyRecipe: {
		type: Schema.Types.Mixed
	}
});

const Recipe = mongoose.model("Recipe", RecipeSchema);

module.exports = Recipe;
