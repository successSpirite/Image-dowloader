// Generate random starts 
function createStars() {
    const starContainer = document.querySelector('.star');
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    for(let i = 0; i < 100; i++ ){
        const star = document.createElement("div");
        star.className = ("star");
        star.style.left = `${Math.random() * windowWidth}px`;
        star.style.top = `${Math.random() * windowHeight}px`;
        starContainer.appendChild(star);
    }

}
window.addEventListener("load", createStars);




// Dark and Light mode 

const toggle = document.getElementById("themeToggle");
const section = document.querySelector(".section"); // change if needed

toggle.addEventListener("change", () => {
  section.classList.toggle("dark-mode");

  if (section.classList.contains("dark-mode")) {
    localStorage.setItem("sectionTheme", "dark");
  } else {
    localStorage.setItem("sectionTheme", "light");
  }
});

// Keep state after refresh
window.addEventListener("load", () => {
  if (localStorage.getItem("sectionTheme") === "dark") {
    section.classList.add("dark-mode");
    toggle.checked = true;
  }
});





// Loading Images operator

// search Button
const searchInput = document.querySelector(".searchBTN input");
const searchBtn = document.querySelector(".searchBTN button");

let searchQuery = "";

searchBtn.addEventListener("click", () => {
  searchQuery = searchInput.value.trim();
  imageContainer.innerHTML = ""; // clear old images
    // loader.style.display = "flex";
  getPhotos();
    
});

// when we click on Enter key
searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    searchQuery = searchInput.value.trim();
    imageContainer.innerHTML = "";
    getPhotos();
  }
});
 
// FadUp events

function FadeEvent() {
  const pageTag = document.querySelector(".page_tag");
const PageImge = document.querySelector(".img_image");
    pageTag.classList.add("fadeUp");
    PageImge.classList.add("fadeUp");
      
    };

// Loadersa and images containers events 

const imageContainer = document.getElementById("image-container");

const loader = document.querySelector(".load_container");      // fixed selection

let ready = false;
let imagesLoaded = 0;
let totalImages = 0;                   
let photosArray = [];

// Helper function to set attributes
function setAttributes(element, attributes) {
  for (const key in attributes) {
    element.setAttribute(key, attributes[key]);
  }
}

// Check if all images were loaded
function imageLoaded() {
  imagesLoaded++;
  console.log("Images loaded:", imagesLoaded);
  if (imagesLoaded === totalImages) {
    ready = true;
    loader.style.display = "none"; // hide loader
    FadeEvent();     //FadeEvent added
    console.log("Ready for more images:", ready);
  }
}

// Create elements for links & photos, add to DOM
function displayPhotos() {
  imagesLoaded = 0;
  totalImages = photosArray.length;
  console.log("Total images to load:", totalImages);

  photosArray.forEach((photo) => {

    const mainContainer = document.createElement("div");
    mainContainer.className = "imgContainer";

    // Create <a> to link to Unsplash
    const item = document.createElement("a");
    setAttributes(item, {
      href: photo.links.html,
      target: "_blank",
    });



    


    // Create <img> for photo
    const img = document.createElement("img");
    setAttributes(img, {
      src: photo.urls.regular,
      alt: photo.alt_description || "Unsplash Image",
      title: photo.alt_description || "Unsplash Image",
    });

    // Event listener for load
    img.addEventListener("load", imageLoaded);

    // Put <img> inside <a>, then put both inside container
    item.appendChild(img);

    mainContainer.appendChild(item);
     
    imageContainer.appendChild(mainContainer);

    // console.log(ImgContainer);
  });
}

// Unsplash API
const count = 30;
const apiKey = "57XBtDyaGJ8LHrPuBSuqt4sCRZsSym98VZtoGKdkTGE";
// const apiUrl = `https://api.unsplash.com/photos/random/?client_id=${apiKey}&count=${count}`;


function getApiUrl() {
  if (searchQuery) {
    return `https://api.unsplash.com/search/photos?query=${searchQuery}&client_id=${apiKey}&per_page=${count}`;
  } else {
    return `https://api.unsplash.com/photos/random?client_id=${apiKey}&count=${count}`;
  }
}



// Get photos from Unsplash

async function getPhotos() {
   
  loader.style.display = "flex";
 

  try {
    const response = await fetch(getApiUrl());
    const data = await response.json();

    photosArray = searchQuery ? data.results : data;

    displayPhotos();
    
  } catch (error) {
    console.error("Error fetching Unsplash photos:", error);
  }
}


// Scroll event - load more images
window.addEventListener("scroll", () => {
  if (
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000 &&
    ready
  ) {
    ready = false;
    getPhotos();
  }
});

// On load
getPhotos();





