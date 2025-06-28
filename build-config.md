
# Production Build & Laravel Integration Guide

## Step 1: Build the Application
Run the following command to create a production build:
```bash
npm run build
# or
yarn build
# or 
bun run build
```

This will create a `dist` folder with your compiled application.

## Step 2: Copy Files to Laravel
1. Copy the contents of the `dist` folder to your Laravel public directory
2. Recommended structure:
   ```
   public/
   ├── social-media-tool/
   │   ├── assets/
   │   │   ├── index-[hash].js
   │   │   └── index-[hash].css
   │   └── index.html
   ```

## Step 3: Create Laravel Blade View
Create a new blade file (e.g., `resources/views/social-media-tool.blade.php`):

```php
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Social Media Management Tool</title>
    <meta name="description" content="Social Media Management Tool" />
    
    <!-- Include the CSS file from dist build -->
    <link rel="stylesheet" href="{{ asset('social-media-tool/assets/index-[HASH].css') }}">
</head>
<body>
    <div id="root"></div>
    
    <script>
        // Set the user ID globally before the React app loads
        window.USER_ID = {{ auth()->id() ?? 'null' }};
        // Or pass custom user ID from controller:
        // window.USER_ID = {{ $userId ?? 'null' }};
    </script>
    
    <!-- Include the JS file from dist build -->
    <script type="module" src="{{ asset('social-media-tool/assets/index-[HASH].js') }}"></script>
</body>
</html>
```

## Step 4: Create Laravel Route and Controller
In your `routes/web.php`:
```php
Route::get('/social-media-tool', [SocialMediaController::class, 'index'])
    ->name('social-media-tool')
    ->middleware('auth');
```

Create controller:
```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class SocialMediaController extends Controller
{
    public function index(Request $request)
    {
        return view('social-media-tool', [
            'userId' => auth()->id(), // or custom logic
        ]);
    }
}
```

## Step 5: Update Asset Hashes
After building, update the blade file with the actual hash values from the generated files in `dist/assets/`.

## Alternative: Dynamic Asset Loading
For automatic hash handling, you can read the manifest or use:
```php
// In your blade file
@php
    $manifest = json_decode(file_get_contents(public_path('social-media-tool/.vite/manifest.json')), true);
    $cssFile = $manifest['index.html']['css'][0] ?? '';
    $jsFile = $manifest['index.html']['file'] ?? '';
@endphp

<link rel="stylesheet" href="{{ asset('social-media-tool/' . $cssFile) }}">
<script type="module" src="{{ asset('social-media-tool/' . $jsFile) }}"></script>
```

## User ID Passing Options
The tool now supports both methods:
1. **URL Parameter**: `?user_id=123` (existing method)
2. **Global Variable**: `window.USER_ID = 123` (new method for Laravel)

The tool will automatically use the global variable if no URL parameter is provided.
