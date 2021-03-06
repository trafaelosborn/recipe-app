const axios = require("axios");
const express = require("express");
const router = express.Router();
const auth = require("../config/middleware/auth");
const Recipe = require("../models/Recipe");
const config = require("config");
const searchAppId = process.env.APP_ID || config.get("APP_ID");
const apiKey = process.env.API_KEY || config.get("API_KEY");
const calcAppId = process.env.CALCAPP_ID || config.get("CALCAPP_ID");
const calcApiKey = process.env.CALCAPI_KEY || config.get("CALCAPI_KEY");

// Helper function for replacing bad json key in API response
const sugarReplacer = (totalNutrients) => {
	if (totalNutrients["SUGAR.added"]) {
		totalNutrients["SUGARADDED"] = totalNutrients["SUGAR.added"];
		delete totalNutrients["SUGAR.added"];
	}
	return totalNutrients;
};

// @route   GET /api/recipes/find
// @desc    Get all saved recipes
// @access  Private
router.get("/find/:id/:isCustom", auth, (req, res) => {
	// Gets custom OR saved recipes depending on value of isCustom
	let findVal = {
		userId: req.params.id,
		isCustom: req.params.isCustom,
	};
	// Returns custom and saved recipes
	if (req.params.isCustom === "all") { findVal = { userId: req.params.id } };
	Recipe.find(findVal)
		.then(function (data) {
			res.json(data);
		})
		.catch(function (err) {
			console.log(err);
		});
});

// @route   POST /api/recipes/findById/:id
// @desc    Get recipe from DB
// @access  Private
router.get("/findById/:id", auth, (req, res) => {
	const id = req.params.id;
	// Gets recipe data for the given recipeId
	Recipe.findById(id)
		.then((data) => {
			res.json(data);
		})
		.catch((err) => {
			console.log(err);
		});
});

// @route   GET /api/recipes/search/:searchterm
// @desc    Search for recipes
// @access  Public
router.get("/search/:searchterm", (req, res) => {
	const searchterm = req.params.searchterm;
	axios
		.get(
			"https://api.edamam.com/search?q=" +
				searchterm +
				"&app_id=" +
				searchAppId +
				"&app_key=" +
				apiKey
		)
		.then((response) => {
			res.json(response.data.hits);
		});
});

// @route   POST /api/recipes/create
// @desc    Create a new recipe and save to user profile
// @access  Private
router.post("/create", auth, (req, res) => {
	// Run recipe through nutrition API to handle any errors before sending it to the DB
	axios
		.post(
			"https://api.edamam.com/api/nutrition-details?app_id=" +
				calcAppId +
				"&app_key=" +
				calcApiKey,
			{
				title: req.body.recipeName,
				ingr: req.body.ingredientItems,
				prep: req.body.directionItems,
			},
			{ headers: { "Content-Type": "application/json" } }
		)
		.then((result) => {
			// Sanitize API response before sending to mongo
			const nutrients = sugarReplacer(result.data.totalNutrients);
			// If the request was successful, add the new recipe + nutrition data to DB
			Recipe.create({
				userId: req.body.userId.userId,
				recipeName: req.body.recipeName,
				ingredientItems: req.body.ingredientItems,
				directionItems: req.body.directionItems,
				isCustom: true,
				image:
					"https://images.unsplash.com/photo-1466637574441-749b8f19452f?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2000&q=80",
				totalNutrients: nutrients,
				totalDaily: result.data.totalDaily,
			}).then((queryResult) => {
				res.json(queryResult);
			});
		})
		.catch((err) => {
			if (err.response.status === 555) {
				console.log("555 error: Recipe with insufficient quality to process correctly.");
				res.json({ error: 555 });
			}
		});
});

// @route   POST /api/recipes/save
// @desc    Save recipes to user profile
// @access  Private
router.post("/save", auth, (req, res) => {
	// Sanitize API response before sending to mongo
	const nutrients = sugarReplacer(req.body.recipeData.thirdPartyRecipe.totalNutrients);
	// Mongoose does not play well with the raw req data so we have to
	// create a new object for it.
	const newObj = {
		userId: req.body.id.userId,
		thirdPartyRecipe: {
			uri: req.body.recipeData.thirdPartyRecipe.uri
				? req.body.recipeData.thirdPartyRecipe.uri
				: null,
			label: req.body.recipeData.thirdPartyRecipe.label
				? req.body.recipeData.thirdPartyRecipe.label
				: null,
			image: req.body.recipeData.thirdPartyRecipe.image
				? req.body.recipeData.thirdPartyRecipe.image
				: null,
			source: req.body.recipeData.thirdPartyRecipe.source
				? req.body.recipeData.thirdPartyRecipe.source
				: null,
			yield: req.body.recipeData.thirdPartyRecipe.yield
				? req.body.recipeData.thirdPartyRecipe.yield
				: null,
			dietLabels: [req.body.recipeData.thirdPartyRecipe.dietLabels]
				? [req.body.recipeData.thirdPartyRecipe.dietLabels]
				: null,
			healthLabels: [req.body.recipeData.thirdPartyRecipe.healthLabels]
				? [req.body.recipeData.thirdPartyRecipe.healthLabels]
				: null,
			cautions: [req.body.recipeData.thirdPartyRecipe.cautions]
				? [req.body.recipeData.thirdPartyRecipe.cautions]
				: null,
			ingredientLines: [req.body.recipeData.thirdPartyRecipe.ingredientLines]
				? [req.body.recipeData.thirdPartyRecipe.ingredientLines]
				: null,
			calories: req.body.recipeData.thirdPartyRecipe.calories
				? req.body.recipeData.thirdPartyRecipe.calories
				: null,
			totalNutrients: nutrients,
			totalDaily: req.body.recipeData.thirdPartyRecipe.totalDaily
				? req.body.recipeData.thirdPartyRecipe.totalDaily
				: null,
		},
		isCustom: false,
	};
	Recipe.create(newObj)
		.then((data) => {
			res.json(data);
		})
		.catch((err) => console.log(err));
});

// @route   POST /api/recipes/delete/:id/:userId
// @desc    Delete recipes from user profile
// @access  Private
router.post("/delete", auth, (req, res) => {
	//Recipe.deleteOne({ _id: req.params.id })
	Recipe.findOneAndDelete({ _id: req.body.id },{userId: req.user.id})
		.then((result) => {
			res.json(result);
		})
		.catch((err) => {
			console.log(err);
		});
});

module.exports = router;
