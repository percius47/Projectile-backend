// Mock database for testing
let users = [];
let projects = [];
let requirements = [];
let rfqs = [];
let quotes = [];
let idCounter = 1;

const mockDb = {
  query: (text, params) => {
    return new Promise((resolve) => {
      // Simulate database delay
      setTimeout(() => {
        // Mock implementation for our specific queries
        if (text.includes("INSERT INTO users")) {
          const [
            name,
            email,
            password_hash,
            role,
            company_name,
            contact_person,
            phone,
            address,
            gst_number,
          ] = params;
          const newUser = {
            id: idCounter++,
            name,
            email,
            password_hash,
            role,
            company_name,
            contact_person,
            phone,
            address,
            gst_number,
            reset_token: null,
            reset_token_expiry: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          users.push(newUser);
          resolve({ rows: [newUser] });
        } else if (text.includes("SELECT * FROM users WHERE email = $1")) {
          const [email] = params;
          const user = users.find((u) => u.email === email);
          resolve({ rows: user ? [user] : [] });
        } else if (text.includes("SELECT * FROM users WHERE id = $1")) {
          const [id] = params;
          const userId = typeof id === "string" ? parseInt(id) : id;
          const user = users.find((u) => u.id === userId);
          resolve({ rows: user ? [user] : [] });
        } else if (
          text.includes("SELECT * FROM users WHERE reset_token = $1")
        ) {
          const [reset_token] = params;
          const user = users.find((u) => u.reset_token === reset_token);
          resolve({ rows: user ? [user] : [] });
        } else if (text.includes("INSERT INTO projects")) {
          const [name, description, location, deadline, owner_id, status] =
            params;
          const newProject = {
            id: idCounter++,
            name,
            description,
            location,
            deadline,
            owner_id,
            status: status || "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          projects.push(newProject);
          resolve({ rows: [newProject] });
        } else if (text.includes("SELECT * FROM projects WHERE id = $1")) {
          const [id] = params;
          const projectId = typeof id === "string" ? parseInt(id) : id;
          const project = projects.find((p) => p.id === projectId);
          resolve({ rows: project ? [project] : [] });
        } else if (
          text.includes("SELECT * FROM projects WHERE owner_id = $1")
        ) {
          const [owner_id] = params;
          const ownerId =
            typeof owner_id === "string" ? parseInt(owner_id) : owner_id;
          const userProjects = projects.filter((p) => p.owner_id === ownerId);
          resolve({ rows: userProjects });
        } else if (text.includes("UPDATE projects")) {
          const [name, description, location, deadline, status, id] = params;
          const projectId = typeof id === "string" ? parseInt(id) : id;
          const projectIndex = projects.findIndex((p) => p.id === projectId);
          if (projectIndex !== -1) {
            projects[projectIndex] = {
              ...projects[projectIndex],
              name,
              description,
              location,
              deadline,
              status,
              updated_at: new Date().toISOString(),
            };
            resolve({ rows: [projects[projectIndex]] });
          } else {
            resolve({ rows: [] });
          }
        } else if (text.includes("DELETE FROM projects")) {
          const [id] = params;
          const projectId = typeof id === "string" ? parseInt(id) : id;
          const projectIndex = projects.findIndex((p) => p.id === projectId);
          if (projectIndex !== -1) {
            const deletedProject = projects.splice(projectIndex, 1)[0];
            resolve({ rows: [deletedProject] });
          } else {
            resolve({ rows: [] });
          }
        } else if (text.includes("INSERT INTO requirements")) {
          const [
            project_id,
            item_name,
            description,
            quantity,
            unit,
            rate,
            category,
          ] = params;
          const newRequirement = {
            id: idCounter++,
            project_id,
            item_name,
            description,
            quantity: quantity.toString(),
            unit,
            rate: rate ? rate.toString() : null,
            category,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          requirements.push(newRequirement);
          resolve({ rows: [newRequirement] });
        } else if (
          text.includes("SELECT * FROM requirements WHERE project_id = $1")
        ) {
          const [project_id] = params;
          const projectId =
            typeof project_id === "string" ? parseInt(project_id) : project_id;
          const projectRequirements = requirements.filter(
            (r) => r.project_id === projectId
          );
          resolve({ rows: projectRequirements });
        } else if (text.includes("SELECT * FROM requirements WHERE id = $1")) {
          const [id] = params;
          const requirementId = typeof id === "string" ? parseInt(id) : id;
          const requirement = requirements.find((r) => r.id === requirementId);
          resolve({ rows: requirement ? [requirement] : [] });
        } else if (text.includes("UPDATE requirements")) {
          const [item_name, description, quantity, unit, rate, category, id] =
            params;
          const requirementId = typeof id === "string" ? parseInt(id) : id;
          const requirementIndex = requirements.findIndex(
            (r) => r.id === requirementId
          );
          if (requirementIndex !== -1) {
            requirements[requirementIndex] = {
              ...requirements[requirementIndex],
              item_name,
              description,
              quantity: quantity.toString(),
              unit,
              rate: rate ? rate.toString() : null,
              category,
              updated_at: new Date().toISOString(),
            };
            resolve({ rows: [requirements[requirementIndex]] });
          } else {
            resolve({ rows: [] });
          }
        } else if (text.includes("DELETE FROM requirements")) {
          const [id] = params;
          const requirementId = typeof id === "string" ? parseInt(id) : id;
          const requirementIndex = requirements.findIndex(
            (r) => r.id === requirementId
          );
          if (requirementIndex !== -1) {
            const deletedRequirement = requirements.splice(
              requirementIndex,
              1
            )[0];
            resolve({ rows: [deletedRequirement] });
          } else {
            resolve({ rows: [] });
          }
        } else if (text.includes("INSERT INTO rfqs")) {
          const [
            project_id,
            title,
            description,
            deadline,
            status,
            contact_person,
            contact_email,
            contact_phone,
            special_requirements,
          ] = params;
          const newRfq = {
            id: idCounter++,
            project_id,
            title,
            description,
            deadline,
            status: status || "open",
            contact_person: contact_person || null,
            contact_email: contact_email || null,
            contact_phone: contact_phone || null,
            special_requirements: special_requirements || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          rfqs.push(newRfq);
          resolve({ rows: [newRfq] });
        } else if (text.includes("SELECT * FROM rfqs WHERE id = $1")) {
          const [id] = params;
          const rfqId = typeof id === "string" ? parseInt(id) : id;
          const rfq = rfqs.find((r) => r.id === rfqId);
          resolve({ rows: rfq ? [rfq] : [] });
        } else if (text.includes("SELECT * FROM rfqs WHERE project_id = $1")) {
          const [project_id] = params;
          const projectId =
            typeof project_id === "string" ? parseInt(project_id) : project_id;
          const projectRfqs = rfqs.filter((r) => r.project_id === projectId);
          resolve({ rows: projectRfqs });
        } else if (text.includes("SELECT * FROM rfqs WHERE status = 'open'")) {
          const openRfqs = rfqs.filter((r) => r.status === "open");
          resolve({ rows: openRfqs });
        } else if (text.includes("SELECT * FROM rfqs")) {
          resolve({ rows: rfqs });
        } else if (text.includes("UPDATE rfqs")) {
          const fields = text.match(/SET\s+(.*?)\s+WHERE/);
          if (fields) {
            const fieldsString = fields[1];
            const fieldNames = fieldsString
              .split(",")
              .map((f) => f.trim().split("=")[0].trim());

            const updateData = {};
            fieldNames.forEach((field, index) => {
              if (index < params.length - 1) {
                updateData[field] = params[index];
              }
            });

            const rfqId = params[params.length - 1];
            const rfqIdNum =
              typeof rfqId === "string" ? parseInt(rfqId) : rfqId;

            const rfqIndex = rfqs.findIndex((r) => r.id === rfqIdNum);
            if (rfqIndex !== -1) {
              rfqs[rfqIndex] = {
                ...rfqs[rfqIndex],
                ...updateData,
                updated_at: new Date().toISOString(),
              };
              resolve({ rows: [rfqs[rfqIndex]] });
            } else {
              resolve({ rows: [] });
            }
          } else {
            resolve({ rows: [] });
          }
        } else if (text.includes("DELETE FROM rfqs")) {
          const [id] = params;
          const rfqId = typeof id === "string" ? parseInt(id) : id;
          const rfqIndex = rfqs.findIndex((r) => r.id === rfqId);
          if (rfqIndex !== -1) {
            const deletedRfq = rfqs.splice(rfqIndex, 1)[0];
            resolve({ rows: [deletedRfq] });
          } else {
            resolve({ rows: [] });
          }
        } else if (text.includes("INSERT INTO quotes")) {
          const [rfq_id, vendor_id, status, total_amount] = params;
          const newQuote = {
            id: idCounter++,
            rfq_id,
            vendor_id,
            status: status || "submitted",
            total_amount,
            submission_date: new Date().toISOString(),
            last_updated: new Date().toISOString(),
          };
          quotes.push(newQuote);
          resolve({ rows: [newQuote] });
        } else if (text.includes("SELECT * FROM quotes WHERE id = $1")) {
          const [id] = params;
          const quoteId = typeof id === "string" ? parseInt(id) : id;
          const quote = quotes.find((q) => q.id === quoteId);
          resolve({ rows: quote ? [quote] : [] });
        } else if (text.includes("SELECT * FROM quotes WHERE rfq_id = $1")) {
          const [rfq_id] = params;
          const rfqId = typeof rfq_id === "string" ? parseInt(rfq_id) : rfq_id;
          const rfqQuotes = quotes.filter((q) => q.rfq_id === rfqId);
          resolve({ rows: rfqQuotes });
        } else if (text.includes("SELECT * FROM quotes WHERE vendor_id = $1")) {
          const [vendor_id] = params;
          const vendorId =
            typeof vendor_id === "string" ? parseInt(vendor_id) : vendor_id;
          const vendorQuotes = quotes.filter((q) => q.vendor_id === vendorId);
          resolve({ rows: vendorQuotes });
        } else if (text.includes("SELECT * FROM quotes")) {
          resolve({ rows: quotes });
        } else if (text.includes("UPDATE quotes")) {
          const fields = text.match(/SET\s+(.*?)\s+WHERE/);
          if (fields) {
            const fieldsString = fields[1];
            const fieldNames = fieldsString
              .split(",")
              .map((f) => f.trim().split("=")[0].trim());

            const updateData = {};
            fieldNames.forEach((field, index) => {
              if (index < params.length - 1) {
                updateData[field] = params[index];
              }
            });

            const quoteId = params[params.length - 1];
            const quoteIdNum =
              typeof quoteId === "string" ? parseInt(quoteId) : quoteId;

            const quoteIndex = quotes.findIndex((q) => q.id === quoteIdNum);
            if (quoteIndex !== -1) {
              quotes[quoteIndex] = {
                ...quotes[quoteIndex],
                ...updateData,
                last_updated: new Date().toISOString(),
              };
              resolve({ rows: [quotes[quoteIndex]] });
            } else {
              resolve({ rows: [] });
            }
          } else {
            resolve({ rows: [] });
          }
        } else if (text.includes("DELETE FROM quotes")) {
          const [id] = params;
          const quoteId = typeof id === "string" ? parseInt(id) : id;
          const quoteIndex = quotes.findIndex((q) => q.id === quoteId);
          if (quoteIndex !== -1) {
            const deletedQuote = quotes.splice(quoteIndex, 1)[0];
            resolve({ rows: [deletedQuote] });
          } else {
            resolve({ rows: [] });
          }
        } else if (text.includes("UPDATE users")) {
          // Extract field names from the query
          const fieldMatches = text.match(/SET\s+(.*?)\s+WHERE/);
          if (fieldMatches) {
            const fieldsString = fieldMatches[1];
            const fields = fieldsString
              .split(",")
              .map((f) => f.trim().split("=")[0].trim());

            // Create an object with the updated values
            const updateData = {};
            fields.forEach((field, index) => {
              // Skip the last parameter which is the WHERE clause
              if (index < params.length - 1) {
                updateData[field] = params[index];
              }
            });

            // The ID is the last parameter
            const userId = params[params.length - 1];
            const userIdNum =
              typeof userId === "string" ? parseInt(userId) : userId;

            const userIndex = users.findIndex((u) => u.id === userIdNum);
            if (userIndex !== -1) {
              users[userIndex] = {
                ...users[userIndex],
                ...updateData,
                updated_at: new Date().toISOString(),
              };
              resolve({ rows: [users[userIndex]] });
            } else {
              resolve({ rows: [] });
            }
          } else {
            resolve({ rows: [] });
          }
        } else {
          // Default response for unhandled queries
          resolve({ rows: [] });
        }
      }, 10);
    });
  },
  
  // Add reset function to fix test issues
  reset: () => {
    users = [];
    projects = [];
    requirements = [];
    rfqs = [];
    quotes = [];
    idCounter = 1;
  }
};

module.exports = mockDb;