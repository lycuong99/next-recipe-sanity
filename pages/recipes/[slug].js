import { useState } from "react";
import { sanityClient, urlFor, PortableText, usePreviewSubscription } from "../../lib/sanity";
const recipeQuery = `*[_type == "recipe" && slug.current == $slug][0]{
    _id, name, slug, 
    mainImage,
    ingredient[]{
        _key,
        unit,
        wholeNumber,
        fraction,
        ingredient->{
            name
        }
    },
    instructions,
    likes
}`;

export default function OneRecipe({ data, preview }) {
  const { data: recipe } = usePreviewSubscription(recipeQuery, {
    params: { slug: data.recipe?.slug.current },
    initialData: data,
    enabled: preview,
  });

  const [likes, setLikes] = useState(data?.recipe?.likes);

  const addLike = async () => {
    const res = await fetch("/api/handle-like", {
      method: "POST",
      body: JSON.stringify({ _id: recipe._id }),
    }).catch((err) => console.log(err));

    const data = await res.json();

    setLikes(data.likes);
  };
  //   const { recipe } = data;

  return (
    <article className="recipe">
      <h1>{recipe.name}</h1>
      <button className="like-btn" onClick={addLike}>
        {likes} likes
      </button>
      <main className="content">
        <img src={urlFor(data?.recipe?.mainImage).url()} alt={recipe.name} />
        <div className="breakdown">
          <ul className="ingredients">
            {recipe.ingredient?.map((ingredient) => (
              <li key={ingredient._key} className="ingredient">
                {ingredient?.wholeNumber}x{ingredient?.fraction}
                <span> {ingredient?.unit}</span>
                <br />
                {ingredient?.ingredient?.name}
              </li>
            ))}
          </ul>
          <div className="instructions">
            <PortableText value={recipe?.instructions} />
          </div>
        </div>
      </main>
    </article>
  );
}

export async function getStaticPaths() {
  const paths = await sanityClient.fetch(
    `*[_type == "recipe" && defined(slug.current)]{
            "params":{
                "slug": slug.current
            }
        }`
  );

  return {
    paths,
    fallback: true,
  };
}

export async function getStaticProps({ params }) {
  const { slug } = params;

  const recipe = await sanityClient.fetch(recipeQuery, { slug });

  return { props: { data: { recipe }, preview: true } };
}
