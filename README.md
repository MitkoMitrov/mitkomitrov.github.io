# Mitko Mitrov - Portfolio Website

A modern, responsive portfolio website showcasing full-stack development expertise and projects.

## 🎨 Features

- **Modern Design**: Clean, contemporary UI with glassmorphism effects and smooth animations
- **Responsive**: Fully mobile-responsive across all device sizes
- **Fast**: Optimized for performance with minimal dependencies
- **Accessible**: Semantic HTML with good contrast and keyboard navigation
- **Skills Showcase**: Organized skill categories with modern tag-based layout
- **Project Portfolio**: Featured projects with tech stacks and key features
- **Smooth Animations**: ScrollReveal animations for engaging user experience

## 📁 Project Structure

```
mitkomitrov.github.io/
├── assets/
│   ├── css/
│   │   └── styles.css (compiled from SCSS)
│   ├── scss/
│   │   └── styles.scss (source styles)
│   ├── js/
│   │   └── main.js
│   └── img/
│       ├── logos/
│       ├── about.jpg
│       ├── perfil.png
│       └── YouABLE.png
├── index.html (main page)
├── CNAME (custom domain)
└── README.md
```

## 🛠 Technology Stack

### Frontend
- HTML5
- SCSS/CSS3
- JavaScript (Vanilla)
- ScrollReveal.js (animations)
- Box Icons (iconography)

### Build & Deployment
- SCSS compilation
- GitHub Pages hosting
- Custom domain support

## 🚀 Getting Started

### Prerequisites
- Node.js & npm (for SCSS compilation)
- Git
- A text editor

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/MitkoMitrov/mitkomitrov.github.io.git
cd mitkomitrov.github.io
```

2. **Install dependencies** (for SCSS compilation)
```bash
npm install -g sass
```

3. **Compile SCSS to CSS**
```bash
sass assets/scss/styles.scss assets/css/styles.css
```

4. **Watch for changes** (during development)
```bash
sass --watch assets/scss:assets/css
```

5. **Serve locally**
```bash
# Using Python 3
python -m http.server 8000

# Or using Node.js
npx http-server
```

Then open `http://localhost:8000` in your browser.

## 📦 Customization

### Update Content
- **index.html**: Edit bio, projects, skills sections
- **CV Link**: Update the Dropbox link in the home section
- **Social Links**: Update LinkedIn, GitHub, email, Upwork links

### Customize Colors

Edit CSS variables in `assets/scss/styles.scss`:

```scss
--hue-color: 224;  // Change this value (0-360)
--first-color: hsl(var(--hue-color), 89%, 60%);
--second-color: hsl(var(--hue-color), 56%, 12%);
```

### Add New Projects

Add new `work__card` elements in the Work section:

```html
<div class="work__card">
  <div class="work__img">
    <img src="path/to/image.png" alt="Project Name">
  </div>
  <div class="work__content">
    <h3 class="work__title">Project Name</h3>
    <p class="work__description">Description</p>
    <div class="work__stack">
      <span class="work__tech">Technology</span>
    </div>
    <!-- Add features and link -->
  </div>
</div>
```

## 🌐 Deploying with Custom Domain

### GitHub Pages Setup

1. **Enable GitHub Pages** in your repository settings
   - Go to Settings → Pages
   - Select "Deploy from a branch"
   - Choose main/master branch and save

2. **Configure Custom Domain**
   - Go to Settings → Pages
   - Enter your custom domain in "Custom domain" field
   - GitHub will create a CNAME file automatically

3. **Update DNS Records** at your domain registrar

   Add these records:
   ```
   Type: A
   Name: @
   Value: 185.199.108.153
   
   Type: A
   Name: @
   Value: 185.199.109.153
   
   Type: A
   Name: @
   Value: 185.199.110.153
   
   Type: A
   Name: @
   Value: 185.199.111.153
   
   Type: CNAME
   Name: www
   Value: MitkoMitrov.github.io
   ```

   Or use a single CNAME record:
   ```
   Type: CNAME
   Name: @
   Value: MitkoMitrov.github.io
   ```

4. **Wait for DNS Propagation** (5-24 hours)

5. **Enable HTTPS**
   - In GitHub Pages settings, check "Enforce HTTPS"

### Troubleshooting DNS

- Use online tools to verify DNS: https://mxtoolbox.com/
- Clear browser cache or use incognito mode
- DNS changes can take up to 48 hours to propagate globally

## 📱 Responsive Breakpoints

- **Mobile**: < 576px
- **Tablet**: 576px - 768px
- **Desktop**: 768px - 992px
- **Large Desktop**: ≥ 992px

## ⚙ JavaScript Features

### Mobile Menu
- Auto-close on link click
- Smooth transitions
- Keyboard accessible

### Scroll Animations
- Elements fade in on scroll
- ScrollReveal library integration
- Customizable delay and distance

### Active Navigation
- Highlights current section as you scroll
- Smooth underline animations

## 🔧 Maintenance

### Update Dependencies
```bash
npm update
```

### Compile SCSS Production Build
```bash
sass --style=compressed assets/scss/styles.scss assets/css/styles.css
```

## 📊 Performance Tips

- Image optimization: Use compressed PNG/JPG files
- Lazy load images for better performance
- Minimize CSS and JavaScript for production
- Use CDN for external libraries

## 📄 License

This project is open source and available under the MIT License.

## 👤 Author

**Mitko Mitrov**
- 💼 [LinkedIn](https://www.linkedin.com/in/mitko-mitrov-14aa3b191/)
- 🐙 [GitHub](https://github.com/MitkoMitrov)
- 📧 [Email](mailto:mitkomitrov09@gmail.com)
- 💼 [Upwork](https://www.upwork.com/freelancers/~018df51bc5ad143170)

---

Made with ❤️ by Mitko Mitrov
