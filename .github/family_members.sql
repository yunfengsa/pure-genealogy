-- 创建家族成员表
CREATE TABLE family_members (
id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  generation integer,
  sibling_order integer,
  father_id bigint,
  gender text CHECK (gender = ANY (ARRAY['男'::text, '女'::text])),
  official_position text,
  is_alive boolean DEFAULT true,
  spouse text,
  remarks text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  birthday date,
  residence_place text,
  CONSTRAINT family_members_pkey PRIMARY KEY (id),
  CONSTRAINT family_members_father_id_fkey FOREIGN KEY (father_id) REFERENCES public.family_members(id)
);

-- 为字段添加注释
COMMENT ON TABLE family_members IS '家族成员信息表';
COMMENT ON COLUMN family_members.id IS '唯一标识 ID';
COMMENT ON COLUMN family_members.name IS '姓名';
COMMENT ON COLUMN family_members.generation IS '世代';
COMMENT ON COLUMN family_members.sibling_order IS '排行';
COMMENT ON COLUMN family_members.father_id IS '父亲的 ID (外键关联 ID 字段)';
COMMENT ON COLUMN family_members.gender IS '性别';
COMMENT ON COLUMN family_members.official_position IS '官职';
COMMENT ON COLUMN family_members.is_alive IS '是否在世';
COMMENT ON COLUMN family_members.spouse IS '配偶姓名';
COMMENT ON COLUMN family_members.remarks IS '备注';
COMMENT ON COLUMN family_members.updated_at IS '最后更新时间';
COMMENT ON COLUMN family_members.birthday IS '出生日期';
COMMENT ON COLUMN family_members.residence_place IS '居住地';

-- 创建索引以优化查询速度
CREATE INDEX idx_family_members_father_id ON family_members(father_id);
CREATE INDEX idx_family_members_name ON family_members(name);
