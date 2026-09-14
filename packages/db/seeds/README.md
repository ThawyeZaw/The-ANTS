# D1 seed SQL

Supported syllabi + reserved IDs: [`docs/seeds/target-catalog.md`](../../../docs/seeds/target-catalog.md)  
Playbook (apply commands): [`docs/seeds/README.md`](../../../docs/seeds/README.md)

Next unused number: **0007**. Append every new file to `SEED_ORDER` in `_validate_all_seeds.py`, then:

```bash
python packages/db/seeds/_validate_all_seeds.py
```
