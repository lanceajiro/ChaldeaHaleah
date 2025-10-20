import axios from 'axios';

export const meta = {
  name: 'recipe',
  version: '1.0.0',
  aliases: ['meal', 'food'],
  description: 'Get a random recipe from TheMealDB',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'random',
  type: 'anyone',
  cooldown: 5,
  guide: ['']
};

export async function onStart({ bot, msg, args, response, usages }) {
  const loadingMsg = await response.reply('🍳 *Fetching a random recipe...*', { parse_mode: 'Markdown' });

  try {
    const res = await axios.get('https://www.themealdb.com/api/json/v1/1/random.php', {
      headers: { Accept: 'application/json' }
    });

    const meal = res.data?.meals?.[0];
    if (!meal) {
      await bot.editMessageText('⚠️ Could not retrieve a recipe from the API.', {
        chat_id: msg.chat.id,
        message_id: loadingMsg.message_id,
        parse_mode: 'Markdown'
      });
      return;
    }

    // Collect ingredients
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ingredient && ingredient.trim() !== '') {
        ingredients.push(`- ${ingredient}${measure ? ` (${measure.trim()})` : ''}`);
      }
    }

    const text = `🍽️ *Random Recipe: ${meal.strMeal}*\n\n` +
      `📂 *Category:* ${meal.strCategory}\n\n` +
      `📝 *Instructions:*\n${meal.strInstructions}\n\n` +
      `🥕 *Ingredients:*\n${ingredients.join('\n')}`;

    // Edit loading message with success text
    await bot.editMessageText('✨ *Recipe fetched successfully!*', {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id,
      parse_mode: 'Markdown'
    });

    // Send meal image and recipe info
    await bot.sendPhoto(msg.chat.id, meal.strMealThumb, {
      caption: text,
      parse_mode: 'Markdown'
    });

  } catch (error) {
    await bot.editMessageText(`⚠️ Failed to fetch recipe: ${error.message}`, {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id,
      parse_mode: 'Markdown'
    });
  }
}
