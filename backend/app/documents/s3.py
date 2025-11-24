import boto3


def s3_client(access_key: str | None = None, secret_key: str | None = None, region: str | None = None):
    return boto3.client(
        "s3",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=region,
    )
