-- CreateTable
CREATE TABLE "attachment_department_grants" (
    "grant_id" BIGSERIAL NOT NULL,
    "attachment_id" BIGINT NOT NULL,
    "department_id" BIGINT NOT NULL,
    "granted_by" BIGINT NOT NULL,
    "granted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachment_department_grants_pkey" PRIMARY KEY ("grant_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_attachment_department_grant" ON "attachment_department_grants"("attachment_id", "department_id");

-- CreateIndex
CREATE INDEX "idx_attachment_dept_grants_att_id" ON "attachment_department_grants"("attachment_id");

-- CreateIndex
CREATE INDEX "idx_attachment_dept_grants_dept_id" ON "attachment_department_grants"("department_id");

-- AddForeignKey
ALTER TABLE "attachment_department_grants" ADD CONSTRAINT "attachment_department_grants_attachment_id_fkey" FOREIGN KEY ("attachment_id") REFERENCES "attachments"("attachment_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attachment_department_grants" ADD CONSTRAINT "attachment_department_grants_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("department_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attachment_department_grants" ADD CONSTRAINT "attachment_department_grants_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
