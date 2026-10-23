const {seed:base}=require('./visual068-seed.cjs');const seed=structuredClone(base);seed.products=seed.products.filter(p=>p.id!=='inactive');module.exports={seed};
