class libBNCC {
  /**
   * Initializes the BNCC core engine
   * @param {Object} jsonData - The nested BNCC JSON structure (starting with "EF", "EI", etc.)
   * @param {String|null} initialCode - Optional: immediately boots the engine into a specific skill code
   */
  constructor(jsonData, initialCode = null) {
    this.data = jsonData;
    this.current = null;

    if (initialCode) {
      this.setActiveSkill(initialCode);
    }
  }

  /**
   * Sets the active state of the engine using a specific skill code
   * @param {String} code - Ex: "EF01MA08"
   * @returns {Object|null} The rich skill object or null if not found
   */
  setActiveSkill(code) {
    const richSkill = this._findSkillByCode(code);
    if (richSkill) {
      this.current = richSkill;
      return this.current;
    }
    console.warn(`BNCC Code [${code}] not found in the database.`);
    return null;
  }

  /**
   * Returns the current active state of the engine
   * @returns {Object|null}
   */
  getActiveSkill() {
    return this.current;
  }

  /**
   * Flattens the entire JSON database into a single sequential timeline array
   * Perfect for grid rendering, maps, and absolute index positioning.
   * @param {String} segment - Default: "EF"
   * @returns {Object[]} A linear list of all skills with their parent metadata
   */
  getAll(segment = "EF") {
    const linearList = [];
    const years = this.data[segment];
    if (!years) return [];

    for (const year of Object.keys(years)) {
      for (const block of years[year]) {
        for (const skill of block.habilidades) {
          linearList.push({
            segment,
            year,
            thematic_unit: block.unidade_tematica,
            knowledge_objects: block.objetos_de_conhecimento,
            code: skill.codigo,
            description: skill.descricao
          });
        }
      }
    }
    return linearList;
  }

  /**
   * Moves the state of the engine to the chronological next skill in the curriculum
   * Automatically handles transitions between thematic units and grade school years
   * @returns {Object|null} The new active skill state, or null if the curriculum ends
   */
  next() {
    if (!this.current) {
      console.error("No active skill set. Please set a skill or use getSteps() first.");
      return null;
    }

    const blocks = this.data[this.current.segment][this.current.year];
    const currentBlockIndex = blocks.findIndex(b => b.unidade_tematica === this.current.thematic_unit);
    const currentBlock = blocks[currentBlockIndex];
    const currentSkillIndex = currentBlock.habilidades.findIndex(h => h.codigo === this.current.code);

    // Scenario A: Next skill inside the SAME thematic unit
    if (currentSkillIndex + 1 < currentBlock.habilidades.length) {
      const nextSkillData = currentBlock.habilidades[currentSkillIndex + 1];
      this.current = {
        ...this.current,
        code: nextSkillData.codigo,
        description: nextSkillData.descricao
      };
      return this.current;
    }

    // Scenario B: Unit finished. Jump to the first skill of the NEXT thematic unit of the same year
    if (currentBlockIndex + 1 < blocks.length) {
      const nextBlock = blocks[currentBlockIndex + 1];
      const nextSkillData = nextBlock.habilidades[0];
      
      this.current = {
        segment: this.current.segment,
        year: this.current.year,
        thematic_unit: nextBlock.unidade_tematica,
        knowledge_objects: nextBlock.objetos_de_conhecimento,
        code: nextSkillData.codigo,
        description: nextSkillData.descricao
      };
      return this.current;
    }

    // Scenario C: School year finished. Jump to the first skill of the NEXT grade year
    const availableYears = Object.keys(this.data[this.current.segment]);
    const currentYearIndex = availableYears.indexOf(this.current.year);

    if (currentYearIndex !== -1 && currentYearIndex + 1 < availableYears.length) {
      const nextYear = availableYears[currentYearIndex + 1];
      const firstBlockOfNextYear = this.data[this.current.segment][nextYear][0];
      const nextSkillData = firstBlockOfNextYear.habilidades[0];

      this.current = {
        segment: this.current.segment,
        year: nextYear,
        thematic_unit: firstBlockOfNextYear.unidade_tematica,
        knowledge_objects: firstBlockOfNextYear.objetos_de_conhecimento,
        code: nextSkillData.codigo,
        description: nextSkillData.descricao
      };
      return this.current;
    }

    return null;
  }

  /**
   * Moves the state of the engine to the chronological PREVIOUS skill in the curriculum
   * Seamlessly handles backward boundaries across units and grade years
   * @returns {Object|null} The new active skill state, or null if already at the beginning
   */
  previous() {
    if (!this.current) {
      console.error("No active skill set to backtrack from.");
      return null;
    }

    const blocks = this.data[this.current.segment][this.current.year];
    const currentBlockIndex = blocks.findIndex(b => b.unidade_tematica === this.current.thematic_unit);
    const currentBlock = blocks[currentBlockIndex];
    const currentSkillIndex = currentBlock.habilidades.findIndex(h => h.codigo === this.current.code);

    // Scenario A: There is a previous skill inside the SAME thematic unit
    if (currentSkillIndex > 0) {
      const prevSkillData = currentBlock.habilidades[currentSkillIndex - 1];
      this.current = {
        ...this.current,
        code: prevSkillData.codigo,
        description: prevSkillData.descricao
      };
      return this.current;
    }

    // Scenario B: Already at the first skill of the unit. Go back to the LAST skill of the PREVIOUS unit
    if (currentBlockIndex > 0) {
      const prevBlock = blocks[currentBlockIndex - 1];
      const prevSkillData = prevBlock.habilidades[prevBlock.habilidades.length - 1]; // Last item

      this.current = {
        segment: this.current.segment,
        year: this.current.year,
        thematic_unit: prevBlock.unidade_tematica,
        knowledge_objects: prevBlock.objetos_de_conhecimento,
        code: prevSkillData.codigo,
        description: prevSkillData.descricao
      };
      return this.current;
    }

    // Scenario C: At the absolute beginning of the year. Move to the LAST skill of the PREVIOUS year
    const availableYears = Object.keys(this.data[this.current.segment]);
    const currentYearIndex = availableYears.indexOf(this.current.year);

    if (currentYearIndex > 0) {
      const prevYear = availableYears[currentYearIndex - 1];
      const blocksOfPrevYear = this.data[this.current.segment][prevYear];
      const lastBlockOfPrevYear = blocksOfPrevYear[blocksOfPrevYear.length - 1];
      const prevSkillData = lastBlockOfPrevYear.habilidades[lastBlockOfPrevYear.habilidades.length - 1];

      this.current = {
        segment: this.current.segment,
        year: prevYear,
        thematic_unit: lastBlockOfPrevYear.unidade_tematica,
        knowledge_objects: lastBlockOfPrevYear.objetos_de_conhecimento,
        code: prevSkillData.codigo,
        description: prevSkillData.descricao
      };
      return this.current;
    }

    return null; // Already at the very first skill of the entire database
  }

  /**
   * Dynnamic step router / Wizard interface generator
   */
  getSteps(options = {}) {
    const { code, segment = "EF", year, thematicUnit } = options;

    if (code) {
      return this.setActiveSkill(code);
    }

    if (!year && !thematicUnit) {
      return {
        nextStep: "year",
        availableOptions: Object.keys(this.data[segment] || {})
      };
    }

    if (year && !thematicUnit) {
      const blocks = this.data[segment]?.[year] || [];
      return {
        nextStep: "thematicUnit",
        availableOptions: blocks.map(b => b.unidade_tematica)
      };
    }

    if (year && thematicUnit) {
      const blocks = this.data[segment]?.[year] || [];
      const specificBlock = blocks.find(b => b.unidade_tematica === thematicUnit);
      
      return {
        nextStep: "skillSelection",
        availableOptions: specificBlock ? specificBlock.habilidades : []
      };
    }

    return null;
  }

  _findSkillByCode(code) {
    const cleanCode = code.toUpperCase().trim();
    for (const segment of Object.keys(this.data)) {
      const years = this.data[segment];
      for (const year of Object.keys(years)) {
        for (const block of years[year]) {
          const skill = block.habilidades.find(h => h.codigo === cleanCode);
          if (skill) {
            return {
              segment,
              year,
              thematic_unit: block.unidade_tematica,
              knowledge_objects: block.objetos_de_conhecimento,
              code: skill.codigo,
              description: skill.descricao
            };
          }
        }
      }
    }
    return null;
  }
}

export default libBNCC;
