// Module boundary keeps the large vocabulary out of the startup bundle while
// letting Vite transform JSON for its dev server and production Android assets.
import compact from './product-catalog-compact.json' with { type: 'json' };
export default compact;
