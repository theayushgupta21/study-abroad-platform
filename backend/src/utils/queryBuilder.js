class QueryBuilder {
  constructor(model, queryStr) {
    this.model = model;
    this.queryStr = queryStr;
    this.filters = {};
  }

  filter() {
    const queryObj = { ...this.queryStr };
    const excludedFields = ["page", "sort", "limit", "fields", "sortBy", "sortOrder"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Advanced filtering (gte, gt, lte, lt)
    let queryStrStr = JSON.stringify(queryObj);
    queryStrStr = queryStrStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.filters = JSON.parse(queryStrStr);
    
    // Handle special cases
    if (this.queryStr.q) {
      this.filters.$or = [
        { title: { $regex: this.queryStr.q, $options: "i" } },
        { universityName: { $regex: this.queryStr.q, $options: "i" } },
        { field: { $regex: this.queryStr.q, $options: "i" } },
      ];
      delete this.filters.q;
    }

    if (this.queryStr.intake) {
      this.filters.intakes = this.queryStr.intake;
      delete this.filters.intake;
    }

    if (this.queryStr.maxTuition) {
      this.filters.tuitionFeeUsd = { ...this.filters.tuitionFeeUsd, $lte: Number(this.queryStr.maxTuition) };
      delete this.filters.maxTuition;
    }

    return this;
  }

  sort() {
    const sortBy = this.queryStr.sortBy || "tuitionFeeUsd";
    const sortOrder = this.queryStr.sortOrder === "asc" ? 1 : -1;
    this.sortCriteria = { [sortBy]: sortOrder };
    return this;
  }

  paginate() {
    const page = this.queryStr.page * 1 || 1;
    const limit = this.queryStr.limit * 1 || 10;
    const skip = (page - 1) * limit;
    this.paginationOptions = { skip, limit, page };
    return this;
  }

  async execute() {
    const [items, total] = await Promise.all([
      this.model.find(this.filters)
        .sort(this.sortCriteria)
        .skip(this.paginationOptions.skip)
        .limit(this.paginationOptions.limit)
        .lean(),
      this.model.countDocuments(this.filters),
    ]);

    return {
      items,
      meta: {
        page: this.paginationOptions.page,
        limit: this.paginationOptions.limit,
        total,
        totalPages: Math.ceil(total / this.paginationOptions.limit),
      },
    };
  }
}

module.exports = QueryBuilder;
