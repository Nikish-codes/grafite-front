# Feedback Animation Assets

This folder contains media assets for the celebration and wrong-answer feedback animations in the application.

## Folder Structure

- `/celebrations/` - Contains celebration images and sounds for correct answer streaks
- `/wrong-feedback/` - Contains feedback images and sounds for wrong answer streaks

## How to Add Media Files

### Celebration Files

1. Add celebration GIFs or images to the `/celebrations/` folder with these naming patterns:
   - `celebration1.gif`
   - `celebration2.gif`
   - `celebration3.gif`
   - etc.

2. Add celebration sound files to the `/celebrations/` folder with these naming patterns:
   - `success1.mp3`
   - `success2.mp3`
   - `success3.mp3`
   - etc.

### Wrong Feedback Files

1. Add wrong feedback GIFs or images to the `/wrong-feedback/` folder with these naming patterns:
   - `wrong1.gif`
   - `wrong2.gif`
   - `wrong3.gif`
   - etc.

2. Add wrong feedback sound files to the `/wrong-feedback/` folder with these naming patterns:
   - `wrong1.mp3`
   - `wrong2.mp3`
   - `wrong3.mp3`
   - etc.

## Recommendations

- **Images**: Use GIF or PNG format for better quality. Optimal dimensions are 500-800px.
- **Sounds**: Use MP3 format with a file size under 200KB for quick loading.
- **Content**: Choose motivational and encouraging content, even for wrong answer feedback.

## How It Works

When a user gets 3 correct answers in a row or 3 wrong answers in a row, the system will:

1. Randomly select an image from the appropriate folder
2. Randomly select a sound from the appropriate folder
3. Display a full-screen overlay with the selected media for 3 seconds
4. Automatically fade out and reset the streak counter

You can adjust these settings in the `FeedbackAnimations.jsx` component. 